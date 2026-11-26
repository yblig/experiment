import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, PenLine, PauseCircle, Minus, Plus, Trash2, ShoppingCart, ChevronRight, Star, User, StickyNote, Percent, Play, PackagePlus, Sparkles, X } from 'lucide-react';
import { useStore, calcCart } from '../store.js';
import { useUI, nav, toast, confirmDialog } from '../ui.js';
import { rp, fmtTime, relDay } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { Header, Sheet, Field, MoneyInput, Seg, Empty, NumInput } from '../components/ui.jsx';
import { ArtBox } from '../components/art.jsx';
import { ProductSheet } from './Products.jsx';

function ProductTile({ p, count, color, onAdd, low }) {
  const out = p.stock != null && p.stock <= 0;
  return (
    <motion.button layout whileTap={{ scale: 0.93 }} onClick={() => onAdd(p)}
      style={{ position: 'relative', background: 'var(--surface)', borderRadius: 20, boxShadow: count ? `0 0 0 2.5px var(--primary), var(--shadow)` : 'var(--shadow)', padding: '12px 10px 12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 148, opacity: out ? 0.55 : 1 }}>
      <div style={{ width: 52, height: 52, borderRadius: 17, background: `color-mix(in srgb, ${color} 16%, var(--surface))`, display: 'grid', placeItems: 'center', fontSize: 28 }}>
        {p.emoji || <span style={{ fontWeight: 800, color, fontSize: 20 }}>{p.name.slice(0, 2).toUpperCase()}</span>}
      </div>
      <div className="bold" style={{ fontSize: '.95rem', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.3em' }}>{p.name}</div>
      <div className="row" style={{ justifyContent: 'space-between', gap: 4, marginTop: 'auto' }}>
        <span className="bold num prim" style={{ fontSize: '.95rem' }}>{rp(p.price)}</span>
      </div>
      {p.stock != null && <span className={'tag ' + (out ? 'red' : low ? 'amber' : 'gray')} style={{ position: 'absolute', top: 10, right: 10 }}>{out ? 'Habis' : `Stok ${p.stock}`}</span>}
      {p.fav && <Star size={14} fill="var(--accent)" color="var(--accent)" style={{ position: 'absolute', top: 12, right: p.stock != null ? undefined : 12, left: p.stock != null ? 52 : undefined }} />}
      <AnimatePresence>
        {count > 0 && (
          <motion.div key={count} initial={{ scale: 0.4 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', damping: 12, stiffness: 500 }}
            className="badge" style={{ position: 'absolute', top: -6, left: -6, minWidth: 30, height: 30, borderRadius: 15, fontSize: '.9rem', background: 'var(--primary)', color: 'var(--on-primary)', border: '3px solid var(--bg)' }}>{count}</motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function Stepper({ value, onChange, size = 44 }) {
  return (
    <div className="row" style={{ gap: 0, background: 'var(--bg2)', borderRadius: 14, padding: 3 }}>
      <button onClick={() => { fx(value <= 1 ? 'remove' : 'tap'); onChange(value - 1); }} style={{ width: size, height: size, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--surface)' }}>{value <= 1 ? <Trash2 size={18} color="var(--expense)" /> : <Minus size={20} />}</button>
      <div className="bold num" style={{ minWidth: 38, textAlign: 'center', fontSize: '1.05rem' }}>{value}</div>
      <button onClick={() => { fx('add'); onChange(value + 1); }} style={{ width: size, height: size, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--primary)', color: 'var(--on-primary)' }}><Plus size={20} /></button>
    </div>
  );
}

function CartSheet({ open, onClose }) {
  const cart = useStore(s => s.cart); const s = useStore(st => st.settings); const customers = useStore(st => st.customers);
  const { setQty, setCart, clearCart, holdCart } = useStore.getState();
  const c = calcCart(cart, s);
  const [edit, setEdit] = useState(null);
  const [showDisc, setShowDisc] = useState(false);
  const sugg = cart.customer && !cart.customerId ? customers.filter(x => x.name.toLowerCase().includes(cart.customer.toLowerCase()) && x.name !== cart.customer).slice(0, 4) : [];
  useEffect(() => { if (open && cart.items.length === 0) onClose(); }, [cart.items.length]);
  const hold = () => { holdCart(); fx('success'); toast('Pesanan ditahan. Lanjutkan kapan saja.'); onClose(); };
  return (
    <>
      <Sheet open={open} onClose={onClose} title={`Pesanan (${c.qty})`} full
        right={<button className="btn sm ghost" style={{ color: 'var(--expense)' }} onClick={async () => { if (await confirmDialog({ title: 'Kosongkan pesanan?', message: 'Semua barang di pesanan ini akan dihapus.', ok: 'Kosongkan', danger: true })) { clearCart(); fx('remove'); onClose(); } }}>Kosongkan</button>}
        footer={
          <div className="row gap12">
            <button className="btn outline" style={{ width: 64, padding: 0 }} onClick={hold} aria-label="Tahan pesanan"><PauseCircle size={24} /></button>
            <button className="btn primary lg grow" onClick={() => { onClose(); nav.push('payment'); }}>Bayar {rp(c.total)} <ChevronRight size={20} /></button>
          </div>
        }>
        <div className="list">
          {c.lines.map(l => (
            <div key={l.key} className="li" style={{ alignItems: 'center' }}>
              <button className="grow" style={{ textAlign: 'left', minWidth: 0 }} onClick={() => { fx('tap'); setEdit(l); }}>
                <div className="t ellipsis">{l.emoji ? l.emoji + ' ' : ''}{l.name}</div>
                <div className="s num">{rp(l.price)} {l.disc ? <span className="red">· diskon {rp(l.disc)}</span> : null}</div>
                <div className="bold num mt8">{rp(l.total)}</div>
              </button>
              <Stepper value={l.qty} onChange={q => setQty(l.key, q)} />
            </div>
          ))}
        </div>

        <div className="card mt12" style={{ padding: 14 }}>
          <Field label="Nama pelanggan (opsional)">
            <div className="input-wrap"><span className="prefix"><User size={18} /></span><input className="input" value={cart.customer} onChange={e => setCart({ customer: e.target.value, customerId: null })} placeholder="Contoh: Bu Ani" /></div>
            {sugg.length > 0 && <div className="row gap8 mt8" style={{ flexWrap: 'wrap' }}>{sugg.map(x => <button key={x.id} className="chip" onClick={() => setCart({ customer: x.name, customerId: x.id })}>{x.name}</button>)}</div>}
          </Field>
          <Field label="Catatan (opsional)">
            <div className="input-wrap"><span className="prefix"><StickyNote size={18} /></span><input className="input" value={cart.note} onChange={e => setCart({ note: e.target.value })} placeholder="Contoh: pedas, dibungkus" /></div>
          </Field>
          {!showDisc && !cart.discVal ? (
            <button className="btn soft block sm" onClick={() => setShowDisc(true)}><Percent size={18} /> Tambah diskon</button>
          ) : (
            <Field label="Diskon total">
              <div className="row gap8">
                <div style={{ width: 130 }}><Seg value={cart.discType} onChange={v => setCart({ discType: v, discVal: 0 })} options={[{ value: 'pct', label: '%' }, { value: 'rp', label: 'Rp' }]} /></div>
                <div className="grow">{cart.discType === 'pct'
                  ? <NumInput value={cart.discVal || ''} onChange={v => setCart({ discVal: Math.min(100, Number(v) || 0) })} placeholder="0" />
                  : <MoneyInput value={cart.discVal} onChange={v => setCart({ discVal: v })} />}</div>
              </div>
            </Field>
          )}
        </div>

        <div className="card mt12">
          <div className="kv"><span>Subtotal</span><span className="num">{rp(c.subtotal)}</span></div>
          {c.discount > 0 && <div className="kv"><span>Diskon</span><span className="num red">-{rp(c.discount)}</span></div>}
          {c.service > 0 && <div className="kv"><span>Layanan {s.servicePct}%</span><span className="num">{rp(c.service)}</span></div>}
          {c.tax > 0 && <div className="kv"><span>Pajak {s.taxPct}%</span><span className="num">{rp(c.tax)}</span></div>}
          <div className="dash" />
          <div className="kv" style={{ fontSize: '1.2rem' }}><span style={{ color: 'var(--text)', fontWeight: 800 }}>Total</span><span className="num bold">{rp(c.total)}</span></div>
        </div>
      </Sheet>
      <LineSheet line={edit} onClose={() => setEdit(null)} />
    </>
  );
}

function LineSheet({ line, onClose }) {
  const [f, setF] = useState(null);
  useEffect(() => { if (line) setF({ qty: line.qty, price: line.price, disc: line.disc || 0, name: line.name }); }, [line]);
  const { updateLine, removeLine } = useStore.getState();
  return (
    <Sheet open={!!line} onClose={onClose} title="Ubah barang"
      footer={<div className="row gap12">
        <button className="btn outline" style={{ color: 'var(--expense)' }} onClick={() => { removeLine(line.key); fx('remove'); onClose(); }}><Trash2 size={20} /> Hapus</button>
        <button className="btn primary grow" onClick={() => { updateLine(line.key, { qty: Math.max(1, Number(f.qty) || 1), price: f.price, disc: Math.min(f.disc, f.price * f.qty), name: f.name || line.name }); fx('success'); onClose(); }}>Simpan</button>
      </div>}>
      {f && <>
        <Field label="Nama barang"><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Jumlah">
          <div className="row" style={{ justifyContent: 'center' }}><Stepper size={56} value={f.qty} onChange={q => setF({ ...f, qty: Math.max(1, q) })} /></div>
        </Field>
        <Field label="Harga satuan" hint="Ubah harga khusus untuk transaksi ini saja"><MoneyInput value={f.price} onChange={v => setF({ ...f, price: v })} /></Field>
        <Field label="Diskon untuk barang ini (Rp)"><MoneyInput value={f.disc} onChange={v => setF({ ...f, disc: v })} /></Field>
        <div className="card flat row" style={{ justifyContent: 'space-between' }}><span className="muted bold">Total</span><span className="bold num" style={{ fontSize: '1.15rem' }}>{rp(Math.max(0, f.price * f.qty - f.disc))}</span></div>
      </>}
    </Sheet>
  );
}

function ManualSheet({ open, onClose }) {
  const [name, setName] = useState(''); const [price, setPrice] = useState(0); const [qty, setQty] = useState(1);
  useEffect(() => { if (open) { setName(''); setPrice(0); setQty(1); } }, [open]);
  const add = () => { useStore.getState().addManual(name.trim() || 'Barang', price, qty); fx('add'); toast(`${name.trim() || 'Barang'} ditambahkan`); onClose(); };
  return (
    <Sheet open={open} onClose={onClose} title="Ketik barang manual" footer={<button className="btn primary block lg" disabled={!price} onClick={add}><Plus size={20} /> Tambahkan ke pesanan</button>}>
      <p className="small muted" style={{ marginTop: 0 }}>Untuk barang yang belum ada di daftar produk.</p>
      <Field label="Nama barang"><input className="input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Gorengan campur" /></Field>
      <Field label="Harga"><MoneyInput value={price} onChange={setPrice} big /></Field>
      <Field label="Jumlah"><div className="row" style={{ justifyContent: 'center' }}><Stepper size={56} value={qty} onChange={q => setQty(Math.max(1, q))} /></div></Field>
    </Sheet>
  );
}

function HeldSheet({ open, onClose }) {
  const held = useStore(s => s.held); const s = useStore(st => st.settings);
  return (
    <Sheet open={open} onClose={onClose} title="Pesanan ditahan">
      {held.length === 0 ? <div className="empty"><h3>Tidak ada pesanan ditahan</h3><p>Tekan tombol ⏸ di halaman pesanan untuk menahan pesanan dan melayani pembeli lain dulu.</p></div> : (
        <div className="list">
          {held.map(h => {
            const c = calcCart(h.cart, s);
            return (
              <div key={h.id} className="li">
                <div className="ic" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}><PauseCircle size={22} /></div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="t ellipsis">{h.label}</div>
                  <div className="s">{c.qty} barang · {relDay(h.date)} {fmtTime(h.date)}</div>
                  <div className="bold num mt8">{rp(c.total)}</div>
                </div>
                <button className="icon-btn" onClick={() => { useStore.getState().deleteHeld(h.id); fx('remove'); }}><Trash2 size={20} color="var(--expense)" /></button>
                <button className="btn sm primary" onClick={() => { useStore.getState().resumeHeld(h.id); fx('success'); onClose(); }}><Play size={16} /> Lanjut</button>
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

export default function Cashier() {
  const products = useStore(s => s.products); const categories = useStore(s => s.categories);
  const cart = useStore(s => s.cart); const s = useStore(st => st.settings); const held = useStore(st => st.held);
  const [q, setQ] = useState(''); const [cat, setCat] = useState('all');
  const [sheet, setSheet] = useState(null);
  const [editP, setEditP] = useState(null);
  useEffect(() => { if (useUI.getState().cashierIntent === 'held') { setSheet('held'); useUI.setState({ cashierIntent: null }); } }, []);
  const counts = useMemo(() => { const m = {}; cart.items.forEach(i => { if (i.pid) m[i.pid] = (m[i.pid] || 0) + i.qty; }); return m; }, [cart.items]);
  const c = calcCart(cart, s);
  const list = useMemo(() => {
    let l = products;
    if (cat === 'fav') l = l.filter(p => p.fav); else if (cat !== 'all') l = l.filter(p => p.catId === cat);
    if (q.trim()) { const t = q.trim().toLowerCase(); l = l.filter(p => p.name.toLowerCase().includes(t)); }
    return [...l].sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0) || (b.sold || 0) - (a.sold || 0) || a.name.localeCompare(b.name));
  }, [products, cat, q]);
  const colorOf = p => categories.find(x => x.id === p.catId)?.color || p.color || '#0E7C66';
  const add = p => {
    if (p.stock != null && (counts[p.id] || 0) >= p.stock) { fx('error'); toast(`Stok ${p.name} tidak cukup`, { type: 'error' }); if (p.stock <= 0) return; }
    useStore.getState().addToCart(p); fx('add', { rate: 1 + Math.min(6, counts[p.id] || 0) * 0.04 });
  };

  return (
    <div className="page">
      <Header title="Kasir" sub={cart.customer ? `Pelanggan: ${cart.customer}` : 'Ketuk barang untuk menambah'} onBack={() => nav.tab('home')}
        right={<>
          <button className="icon-btn solid" style={{ position: 'relative' }} onClick={() => { fx('tap'); setSheet('held'); }} aria-label="Pesanan ditahan">
            <PauseCircle size={22} />{held.length > 0 && <span className="badge" style={{ position: 'absolute', top: -4, right: -4, background: 'var(--info)', color: '#fff' }}>{held.length}</span>}
          </button>
          <button className="icon-btn solid" onClick={() => { fx('tap'); setSheet('manual'); }} aria-label="Barang manual"><PenLine size={22} /></button>
        </>} />
      {products.length > 0 && <>
        <div className="pad" style={{ paddingBottom: 10 }}>
          <div className="search"><Search size={20} /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari barang…" />
            {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 12, top: 13 }}><X size={20} color="var(--muted)" /></button>}</div>
        </div>
        <div className="chips" style={{ paddingBottom: 10 }}>
          <button className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => { fx('tap'); setCat('all'); }}>Semua</button>
          {products.some(p => p.fav) && <button className={'chip' + (cat === 'fav' ? ' on' : '')} onClick={() => { fx('tap'); setCat('fav'); }}><Star size={15} /> Favorit</button>}
          {categories.map(k => <button key={k.id} className={'chip' + (cat === k.id ? ' on' : '')} onClick={() => { fx('tap'); setCat(k.id); }}><span style={{ width: 9, height: 9, borderRadius: 5, background: k.color }} />{k.name}</button>)}
        </div>
      </>}
      <div className="scroll" style={{ paddingBottom: cart.items.length ? 'calc(var(--safe-bottom) + 110px)' : 'calc(var(--safe-bottom) + 24px)' }}>
        {products.length === 0 ? (
          <Empty art={ArtBox} title="Belum ada produk" text="Tambahkan barang yang Anda jual, atau coba dulu dengan contoh produk warung."
            action={<div className="col gap8" style={{ maxWidth: 300, margin: '0 auto' }}>
              <button className="btn primary block" onClick={() => setEditP({})}><PackagePlus size={20} /> Tambah Produk</button>
              <button className="btn soft block" onClick={() => { useStore.getState().loadSample(); fx('success'); toast('Contoh produk ditambahkan'); }}><Sparkles size={20} /> Pakai contoh produk</button>
              <button className="btn ghost block" onClick={() => setSheet('manual')}><PenLine size={20} /> Ketik barang manual</button>
            </div>} />
        ) : (
          <div className="pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, paddingTop: 6 }}>
            {list.map(p => <ProductTile key={p.id} p={p} count={counts[p.id] || 0} color={colorOf(p)} onAdd={add} low={p.stock != null && p.stock <= s.lowStock} />)}
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => { fx('tap'); setEditP({ catId: cat !== 'all' && cat !== 'fav' ? cat : null }); }}
              style={{ borderRadius: 20, border: '2px dashed var(--line)', minHeight: 148, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--muted)', fontWeight: 700 }}>
              <PackagePlus size={28} /> Produk baru
            </motion.button>
            {list.length === 0 && <div className="muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20 }}>Tidak ada barang “{q}”. <button className="prim bold" onClick={() => setSheet('manual')}>Ketik manual</button></div>}
          </div>
        )}
      </div>

      <AnimatePresence>
        {cart.items.length > 0 && (
          <motion.div initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            style={{ position: 'absolute', left: 12, right: 12, bottom: 'calc(var(--safe-bottom) + 12px)', zIndex: 10 }}>
            <motion.button key={c.qty} initial={{ scale: 0.97 }} animate={{ scale: 1 }} onClick={() => { fx('whoosh'); setSheet('cart'); }}
              className="row" style={{ width: '100%', height: 70, borderRadius: 22, padding: '0 10px 0 18px', background: 'linear-gradient(160deg, var(--primary-2), var(--primary-dark))', color: '#fff', boxShadow: '0 10px 28px color-mix(in srgb, var(--primary) 45%, transparent)' }}>
              <div style={{ position: 'relative' }}><ShoppingCart size={26} /><span className="badge" style={{ position: 'absolute', top: -10, right: -12, background: 'var(--accent)', color: '#3A2600' }}>{c.qty}</span></div>
              <div className="grow" style={{ textAlign: 'left', paddingLeft: 12 }}>
                <div className="tiny" style={{ opacity: 0.85, fontWeight: 700 }}>Total pesanan</div>
                <div className="num" style={{ fontSize: '1.3rem', fontWeight: 800 }}>{rp(c.total)}</div>
              </div>
              <div className="row" style={{ background: 'rgba(255,255,255,.18)', height: 50, borderRadius: 16, padding: '0 14px', fontWeight: 800, gap: 4 }}>Lihat & Bayar <ChevronRight size={20} /></div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <CartSheet open={sheet === 'cart'} onClose={() => setSheet(null)} />
      <ManualSheet open={sheet === 'manual'} onClose={() => setSheet(null)} />
      <HeldSheet open={sheet === 'held'} onClose={() => setSheet(null)} />
      <ProductSheet product={editP} onClose={() => setEditP(null)} />
    </div>
  );
}
