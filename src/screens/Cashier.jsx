import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Search, PenLine, PauseCircle, Minus, Plus, Trash2, ShoppingCart, ChevronRight, Star, User, StickyNote, Percent, Play, PackagePlus, Sparkles, X, Phone, CalendarClock, Scale } from 'lucide-react';
import { useStore, calcCart, isDec, fmtQty, bizOf } from '../store.js';
import { useUI, nav, toast, confirmDialog } from '../ui.js';
import { rp, fmtTime, relDay, startOfDay, toDateInput, fromDateInput, HARI } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { Header, Sheet, Field, MoneyInput, Seg, Empty, NumInput, useWide, DecimalPad } from '../components/ui.jsx';
import { ArtBox } from '../components/art.jsx';
import { ProductSheet } from './Products.jsx';

const toStr = n => (n ? String(Math.round(n * 100) / 100).replace('.', ',') : '');
const toNum = s => Number(String(s || '').replace(',', '.')) || 0;

export function dueAt(days) {
  const d = new Date(startOfDay() + days * 864e5); d.setHours(17, 0, 0, 0);
  if (days === 0 && Date.now() > d.getTime() - 2 * 3600e3) return Date.now() + 3 * 3600e3;
  return d.getTime();
}
export const dueLabel = ts => {
  const days = Math.round((startOfDay(ts) - startOfDay()) / 864e5);
  const t = new Date(ts); const hh = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
  if (days === 0) return `Hari ini ${hh}`;
  if (days === 1) return `Besok ${hh}`;
  if (days < 0) return `${-days} hari lalu`;
  return `${HARI[t.getDay()]}, ${t.getDate()}/${t.getMonth() + 1} ${hh}`;
};

function ProductTile({ p, count, color, onAdd, low }) {
  const out = p.stock != null && p.stock <= 0;
  const dec = isDec(p.unit);
  return (
    <motion.button layout whileTap={{ scale: 0.93 }} onClick={() => onAdd(p)}
      style={{ position: 'relative', background: 'var(--surface)', borderRadius: 20, boxShadow: count ? `0 0 0 2.5px var(--primary), var(--shadow)` : 'var(--shadow)', padding: '12px 10px 12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 148, opacity: out ? 0.55 : 1 }}>
      <div style={{ width: 52, height: 52, borderRadius: 17, background: `color-mix(in srgb, ${color} 16%, var(--surface))`, display: 'grid', placeItems: 'center', fontSize: 28 }}>
        {p.emoji || <span style={{ fontWeight: 800, color, fontSize: 20 }}>{p.name.slice(0, 2).toUpperCase()}</span>}
      </div>
      <div className="bold" style={{ fontSize: '.95rem', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.3em' }}>{p.name}</div>
      <div className="row" style={{ justifyContent: 'space-between', gap: 4, marginTop: 'auto' }}>
        <span className="bold num prim" style={{ fontSize: '.95rem' }}>{rp(p.price)}{p.unit && p.unit !== 'pcs' ? <span className="muted" style={{ fontWeight: 700, fontSize: '.8rem' }}>/{p.unit}</span> : null}</span>
        {dec && <Scale size={16} color="var(--muted)" />}
      </div>
      {p.stock != null && <span className={'tag ' + (out ? 'red' : low ? 'amber' : 'gray')} style={{ position: 'absolute', top: 10, right: 10 }}>{out ? 'Habis' : `Stok ${fmtQty(p.stock)}`}</span>}
      {p.fav && <Star size={14} fill="var(--accent)" color="var(--accent)" style={{ position: 'absolute', top: 12, right: p.stock != null ? undefined : 12, left: p.stock != null ? 52 : undefined }} />}
      <AnimatePresence>
        {count > 0 && (
          <motion.div key={count} initial={{ scale: 0.4 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', damping: 12, stiffness: 500 }}
            className="badge" style={{ position: 'absolute', top: -6, left: -6, minWidth: 30, height: 30, borderRadius: 15, fontSize: '.85rem', background: 'var(--primary)', color: 'var(--on-primary)', border: '3px solid var(--bg)' }}>{dec ? fmtQty(count, p.unit) : count}</motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function Stepper({ value, onChange, size = 44, unit }) {
  return (
    <div className="row" style={{ gap: 0, background: 'var(--bg2)', borderRadius: 14, padding: 3 }}>
      <button onClick={() => { fx(value <= 1 ? 'remove' : 'tap'); onChange(value - 1); }} style={{ width: size, height: size, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--surface)' }}>{value <= 1 ? <Trash2 size={18} color="var(--expense)" /> : <Minus size={20} />}</button>
      <div className="bold num" style={{ minWidth: 38, textAlign: 'center', fontSize: '1.05rem', padding: '0 4px' }}>{fmtQty(value, unit)}</div>
      <button onClick={() => { fx('add'); onChange(value + 1); }} style={{ width: size, height: size, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--primary)', color: 'var(--on-primary)' }}><Plus size={20} /></button>
    </div>
  );
}

// ---------- weigh / decimal quantity ----------
function WeighSheet({ target, onClose }) {
  const [v, setV] = useState('');
  useEffect(() => { if (target) setV(toStr(target.qty)); }, [target]);
  const q = toNum(v);
  const p = target?.product;
  const save = () => {
    const st = useStore.getState();
    if (target.line) { if (q <= 0) st.removeLine(target.line.key); else st.updateLine(target.line.key, { qty: q }); }
    else if (target.existing) st.setLineQty(p.id, q);
    else if (q > 0) st.addToCart(p, q);
    fx(q > 0 ? 'add' : 'remove'); onClose();
  };
  const unit = p?.unit || target?.line?.unit || 'kg';
  const price = p?.price ?? target?.line?.price ?? 0;
  return (
    <Sheet open={!!target} onClose={onClose} title={p?.name || target?.line?.name || 'Jumlah'}
      footer={<button className="btn primary block lg" onClick={save} disabled={!q && !target?.existing && !target?.line}>{q ? <>Simpan {fmtQty(q, unit)} · {rp(Math.round(price * q))}</> : target?.existing || target?.line ? 'Hapus dari pesanan' : 'Masukkan jumlah'}</button>}>
      <div className="card" style={{ textAlign: 'center', padding: '14px 16px' }}>
        <div className="small bold muted">Berat / jumlah ({unit})</div>
        <div className="num" style={{ fontSize: '2.6rem', fontWeight: 800, letterSpacing: '-.02em' }}>{v || '0'} <span style={{ fontSize: '1.3rem', color: 'var(--muted)' }}>{unit}</span></div>
        <div className="small muted num">{rp(price)} / {unit} × {fmtQty(q)} = <b style={{ color: 'var(--text)' }}>{rp(Math.round(price * q))}</b></div>
      </div>
      <div className="row gap8 mt12" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {[1, 2, 3, 5, 7, 10].map(n => <button key={n} className="chip" onClick={() => { fx('tap'); setV(toStr(n)); }}>{n} {unit}</button>)}
        <button className="chip" onClick={() => { fx('tap'); setV(toStr(q + 0.5)); }}>+0,5</button>
      </div>
      <div className="mt12"><DecimalPad value={v} onChange={setV} /></div>
      <div className="tiny muted mt8" style={{ textAlign: 'center' }}>Pakai koma untuk desimal, contoh 3,5 {unit}</div>
    </Sheet>
  );
}

// ---------- cart content (sheet on phones, side panel on tablets) ----------
function CartContent({ onEdit, onWeigh }) {
  const cart = useStore(s => s.cart); const s = useStore(st => st.settings); const customers = useStore(st => st.customers);
  const { setQty, setCart } = useStore.getState();
  const c = calcCart(cart, s);
  const [showDisc, setShowDisc] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [customDue, setCustomDue] = useState(false);
  const sugg = cart.customer && !cart.customerId ? customers.filter(x => x.name.toLowerCase().includes(cart.customer.toLowerCase()) && x.name !== cart.customer).slice(0, 4) : [];
  useEffect(() => { if (s.trackOrders && cart.items.length && cart.due === null) setCart({ due: dueAt(s.dueDays ?? 2) }); }, [cart.items.length, s.trackOrders]);
  const laundry = s.bizType === 'laundry';
  const dueOpts = [[0, 'Hari ini'], [1, 'Besok'], [2, '2 hari'], [3, '3 hari']];
  return (
    <>
      <div className="list">
        {c.lines.map(l => (
          <div key={l.key} className="li" style={{ alignItems: 'center' }}>
            <button className="grow" style={{ textAlign: 'left', minWidth: 0 }} onClick={() => { fx('tap'); onEdit(l); }}>
              <div className="t ellipsis">{l.emoji ? l.emoji + ' ' : ''}{l.name}</div>
              <div className="s num">{l.grosir ? <><s>{rp(l.basePrice)}</s> <b className="prim">{rp(l.price)} grosir</b></> : rp(l.price)}{l.unit && l.unit !== 'pcs' ? '/' + l.unit : ''} {l.disc ? <span className="red">· diskon {rp(l.disc)}</span> : null}</div>
              <div className="bold num mt8">{rp(l.total)}</div>
            </button>
            {isDec(l.unit)
              ? <button className="btn sm soft" onClick={() => onWeigh({ line: l, qty: l.qty })}><Scale size={17} /> {fmtQty(l.qty, l.unit)}</button>
              : <Stepper value={l.qty} unit={l.unit} onChange={q => setQty(l.key, q)} />}
          </div>
        ))}
      </div>

      <div className="card mt12" style={{ padding: 14 }}>
        <Field label={s.trackOrders ? 'Nama pelanggan' : 'Nama pelanggan (opsional)'}>
          <div className="input-wrap"><span className="prefix"><User size={18} /></span><input className="input" value={cart.customer} onChange={e => setCart({ customer: e.target.value, customerId: null })} placeholder="Contoh: Bu Ani" /></div>
          {sugg.length > 0 && <div className="row gap8 mt8" style={{ flexWrap: 'wrap' }}>{sugg.map(x => <button key={x.id} className="chip" onClick={() => setCart({ customer: x.name, customerId: x.id, phone: x.phone || cart.phone })}>{x.name}</button>)}</div>}
        </Field>
        {s.trackOrders && (
          <Field label="No. HP / WhatsApp" hint="Untuk kabar saat pesanan sudah siap">
            <div className="input-wrap"><span className="prefix"><Phone size={18} /></span><input className="input" inputMode="tel" value={cart.phone || ''} onChange={e => setCart({ phone: e.target.value })} placeholder="08xxxxxxxxxx" /></div>
          </Field>
        )}
        {s.trackOrders && (
          <Field label={laundry ? 'Estimasi cucian selesai' : 'Estimasi selesai'}>
            <div className="row gap8" style={{ flexWrap: 'wrap' }}>
              {dueOpts.map(([d, l]) => { const ts = dueAt(d); const on = cart.due && startOfDay(cart.due) === startOfDay(ts) && !customDue; return <button key={d} className={'chip' + (on ? ' on' : '')} onClick={() => { fx('tap'); setCustomDue(false); setCart({ due: ts }); }}>{l}</button>; })}
              <button className={'chip' + (customDue ? ' on' : '')} onClick={() => { fx('tap'); setCustomDue(true); }}><CalendarClock size={15} /> Pilih tanggal</button>
              <button className={'chip' + (!cart.due ? ' on' : '')} onClick={() => { fx('tap'); setCustomDue(false); setCart({ due: 0 }); }}>Langsung selesai</button>
            </div>
            {customDue && <input type="date" className="input mt8" value={cart.due ? toDateInput(cart.due) : ''} min={toDateInput(Date.now())} onChange={e => { if (!e.target.value) return; const t = fromDateInput(e.target.value); const d = new Date(t); d.setHours(17, 0, 0, 0); setCart({ due: d.getTime() }); }} />}
            {cart.due ? <div className="small bold prim mt8"><CalendarClock size={14} style={{ verticalAlign: -2 }} /> Selesai: {dueLabel(cart.due)}</div> : null}
          </Field>
        )}
        <Field label="Catatan (opsional)">
          <div className="input-wrap"><span className="prefix"><StickyNote size={18} /></span><input className="input" value={cart.note} onChange={e => setCart({ note: e.target.value })} placeholder={laundry ? 'Contoh: jangan dicampur baju putih' : 'Contoh: pedas, dibungkus'} /></div>
        </Field>
        <div className="row gap8" style={{ marginBottom: 12 }}>
          {!showExtra && !cart.extra
            ? <button className="btn outline block sm" onClick={() => setShowExtra(true)}><Truck size={18} /> {s.extraLabel || 'Biaya tambahan'}</button>
            : <div className="grow"><Field label={`${s.extraLabel || 'Biaya tambahan'} (Rp)`}><MoneyInput value={cart.extra} onChange={v => setCart({ extra: v })} /></Field></div>}
        </div>
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
        {c.extra > 0 && <div className="kv"><span>{s.extraLabel || 'Biaya tambahan'}</span><span className="num">{rp(c.extra)}</span></div>}
        {c.roundAdj !== 0 && <div className="kv"><span>Pembulatan</span><span className="num">{c.roundAdj > 0 ? '+' : ''}{rp(c.roundAdj)}</span></div>}
        <div className="dash" />
        <div className="kv" style={{ fontSize: '1.2rem' }}><span style={{ color: 'var(--text)', fontWeight: 800 }}>Total</span><span className="num bold">{rp(c.total)}</span></div>
        {c.saved > 0 && <div className="small bold green" style={{ textAlign: 'right' }}>Pelanggan hemat {rp(c.saved)}</div>}
      </div>
    </>
  );
}

function useCartActions(onDone) {
  const s = useStore(st => st.settings);
  const hold = () => { useStore.getState().holdCart(); fx('success'); toast('Pesanan ditahan. Lanjutkan kapan saja.'); onDone?.(); };
  const pay = () => {
    const cart = useStore.getState().cart;
    if (s.trackOrders && cart.due && !cart.customer.trim()) { fx('error'); toast('Isi nama pelanggan dulu', { type: 'error' }); return; }
    onDone?.(); nav.push('payment');
  };
  const clear = async () => { if (await confirmDialog({ title: 'Kosongkan pesanan?', message: 'Semua barang di pesanan ini akan dihapus.', ok: 'Kosongkan', danger: true })) { useStore.getState().clearCart(); fx('remove'); onDone?.(); } };
  return { hold, pay, clear };
}

function CartFooter({ onDone }) {
  const cart = useStore(s => s.cart); const s = useStore(st => st.settings);
  const c = calcCart(cart, s);
  const { hold, pay } = useCartActions(onDone);
  return (
    <div className="row gap12">
      <button className="btn outline" style={{ width: 64, padding: 0 }} onClick={hold} aria-label="Tahan pesanan"><PauseCircle size={24} /></button>
      <button className="btn primary lg grow" disabled={!c.lines.length} onClick={pay}>Bayar {rp(c.total)} <ChevronRight size={20} /></button>
    </div>
  );
}

function CartSheet({ open, onClose, onEdit, onWeigh }) {
  const cart = useStore(s => s.cart); const s = useStore(st => st.settings);
  const c = calcCart(cart, s);
  const { clear } = useCartActions(onClose);
  useEffect(() => { if (open && cart.items.length === 0) onClose(); }, [cart.items.length]);
  return (
    <Sheet open={open} onClose={onClose} title={`Pesanan (${c.qty})`} full
      right={<button className="btn sm ghost" style={{ color: 'var(--expense)' }} onClick={clear}>Kosongkan</button>}
      footer={<CartFooter onDone={onClose} />}>
      <CartContent onEdit={onEdit} onWeigh={onWeigh} />
    </Sheet>
  );
}

function CartPanel({ onEdit, onWeigh }) {
  const cart = useStore(s => s.cart); const s = useStore(st => st.settings);
  const c = calcCart(cart, s);
  const { clear } = useCartActions();
  return (
    <div className="col" style={{ width: 'min(42%, 440px)', flex: 'none', background: 'var(--bg2)', borderLeft: '1px solid var(--line)', minHeight: 0 }}>
      <div className="row" style={{ padding: 'calc(var(--safe-top) + 14px) 16px 8px' }}>
        <ShoppingCart size={22} />
        <div className="grow bold" style={{ fontSize: '1.15rem' }}>Pesanan {c.qty ? `(${c.qty})` : ''}</div>
        {c.lines.length > 0 && <button className="btn sm ghost" style={{ color: 'var(--expense)' }} onClick={clear}>Kosongkan</button>}
      </div>
      <div className="scroll" style={{ padding: '0 14px 14px' }}>
        {c.lines.length === 0
          ? <div className="empty" style={{ paddingTop: 60 }}><ShoppingCart size={48} color="var(--line)" /><h3>Pesanan masih kosong</h3><p>Ketuk barang di sebelah kiri untuk menambahkan.</p></div>
          : <CartContent onEdit={onEdit} onWeigh={onWeigh} />}
      </div>
      <div style={{ padding: '12px 14px calc(var(--safe-bottom) + 14px)', borderTop: '1px solid var(--line)', background: 'var(--bg2)' }}><CartFooter /></div>
    </div>
  );
}

function LineSheet({ line, onClose }) {
  const [f, setF] = useState(null);
  const dec = isDec(line?.unit);
  useEffect(() => { if (line) setF({ qty: line.qty, qtyS: toStr(line.qty), price: line.basePrice ?? line.price, disc: line.disc || 0, name: line.name }); }, [line]);
  const { updateLine, removeLine } = useStore.getState();
  const qty = f ? (dec ? toNum(f.qtyS) : f.qty) : 0;
  return (
    <Sheet open={!!line} onClose={onClose} title="Ubah barang"
      footer={<div className="row gap12">
        <button className="btn outline" style={{ color: 'var(--expense)' }} onClick={() => { removeLine(line.key); fx('remove'); onClose(); }}><Trash2 size={20} /> Hapus</button>
        <button className="btn primary grow" disabled={!qty} onClick={() => { updateLine(line.key, { qty, price: f.price, priceEdited: line.priceEdited || f.price !== (line.basePrice ?? line.price), disc: Math.min(f.disc, Math.round(f.price * qty)), name: f.name || line.name }); fx('success'); onClose(); }}>Simpan</button>
      </div>}>
      {f && <>
        <Field label="Nama barang"><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={dec ? `Berat / jumlah (${line.unit})` : 'Jumlah'}>
          {dec
            ? <input className="input num" inputMode="decimal" value={f.qtyS} onChange={e => setF({ ...f, qtyS: e.target.value.replace(/[^\d.,]/g, '').replace('.', ',') })} style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', height: 62 }} />
            : <div className="row" style={{ justifyContent: 'center' }}><Stepper size={56} unit={line.unit} value={f.qty} onChange={q => setF({ ...f, qty: Math.max(1, q) })} /></div>}
        </Field>
        <Field label={`Harga per ${line.unit && line.unit !== 'pcs' ? line.unit : 'barang'}`} hint="Ubah harga khusus untuk transaksi ini saja"><MoneyInput value={f.price} onChange={v => setF({ ...f, price: v })} /></Field>
        <Field label="Diskon untuk barang ini (Rp)"><MoneyInput value={f.disc} onChange={v => setF({ ...f, disc: v })} /></Field>
        <div className="card flat row" style={{ justifyContent: 'space-between' }}><span className="muted bold">Total</span><span className="bold num" style={{ fontSize: '1.15rem' }}>{rp(Math.max(0, Math.round(f.price * qty) - f.disc))}</span></div>
      </>}
    </Sheet>
  );
}

function ManualSheet({ open, onClose }) {
  const [name, setName] = useState(''); const [price, setPrice] = useState(0); const [qty, setQty] = useState(1); const [unit, setUnit] = useState('pcs'); const [qs, setQs] = useState('1');
  useEffect(() => { if (open) { setName(''); setPrice(0); setQty(1); setQs('1'); setUnit(useStore.getState().settings.bizType === 'laundry' ? 'kg' : 'pcs'); } }, [open]);
  const q = unit === 'kg' ? toNum(qs) : qty;
  const add = () => { useStore.getState().addManual(name.trim() || 'Barang', price, q, unit); fx('add'); toast(`${name.trim() || 'Barang'} ditambahkan`); onClose(); };
  return (
    <Sheet open={open} onClose={onClose} title="Ketik barang manual" footer={<button className="btn primary block lg" disabled={!price || !q} onClick={add}><Plus size={20} /> Tambahkan · {rp(Math.round(price * q))}</button>}>
      <p className="small muted" style={{ marginTop: 0 }}>Untuk barang atau layanan yang belum ada di daftar.</p>
      <Field label="Nama"><input className="input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Gorengan campur" /></Field>
      <Field label="Dihitung per"><Seg value={unit} onChange={setUnit} options={[{ value: 'pcs', label: 'Satuan (pcs)' }, { value: 'kg', label: 'Kilo (kg)' }]} /></Field>
      <Field label={unit === 'kg' ? 'Harga per kg' : 'Harga'}><MoneyInput value={price} onChange={setPrice} big /></Field>
      <Field label={unit === 'kg' ? 'Berat (kg)' : 'Jumlah'}>
        {unit === 'kg'
          ? <input className="input num" inputMode="decimal" value={qs} onChange={e => setQs(e.target.value.replace(/[^\d.,]/g, '').replace('.', ','))} style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center', height: 62 }} />
          : <div className="row" style={{ justifyContent: 'center' }}><Stepper size={56} value={qty} onChange={v => setQty(Math.max(1, v))} /></div>}
      </Field>
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
                  <div className="s">{c.qty} item · {relDay(h.date)} {fmtTime(h.date)}</div>
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
  const wide = useWide();
  const biz = bizOf(s.bizType);
  const [q, setQ] = useState(''); const [cat, setCat] = useState('all');
  const [sheet, setSheet] = useState(null);
  const [editP, setEditP] = useState(null);
  const [edit, setEdit] = useState(null);
  const [weigh, setWeigh] = useState(null);
  useEffect(() => { if (useUI.getState().cashierIntent === 'held') { setSheet('held'); useUI.setState({ cashierIntent: null }); } }, []);
  useEffect(() => { if (wide && sheet === 'cart') setSheet(null); }, [wide]);
  const counts = useMemo(() => { const m = {}; cart.items.forEach(i => { if (i.pid && !i.custom) m[i.pid] = (m[i.pid] || 0) + i.qty; }); return m; }, [cart.items]);
  const c = calcCart(cart, s);
  const list = useMemo(() => {
    let l = products.filter(p => !p.hidden);
    if (cat === 'fav') l = l.filter(p => p.fav); else if (cat !== 'all') l = l.filter(p => p.catId === cat);
    if (q.trim()) { const t = q.trim().toLowerCase(); l = l.filter(p => p.name.toLowerCase().includes(t) || (p.sku || '').toLowerCase() === t || (p.sku || '').toLowerCase().includes(t)); }
    return [...l].sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0) || (b.sold || 0) - (a.sold || 0) || a.name.localeCompare(b.name));
  }, [products, cat, q]);
  const colorOf = p => categories.find(x => x.id === p.catId)?.color || p.color || '#0E7C66';
  const add = p => {
    if (isDec(p.unit)) { fx('tap'); setWeigh({ product: p, qty: counts[p.id] || 0, existing: !!counts[p.id] }); return; }
    if (p.stock != null && (counts[p.id] || 0) >= p.stock) { fx('error'); toast(`Stok ${p.name} tidak cukup`, { type: 'error' }); if (p.stock <= 0) return; }
    useStore.getState().addToCart(p); fx('add', { rate: 1 + Math.min(6, counts[p.id] || 0) * 0.04 });
  };

  const catalogue = (
    <div className="page" style={wide ? { position: 'relative', flex: 1, minWidth: 0 } : null}>
      <Header title="Kasir" sub={cart.customer ? `Pelanggan: ${cart.customer}` : `Ketuk ${biz.item.toLowerCase()} untuk menambah`} onBack={() => nav.tab('home')}
        right={<>
          <button className="icon-btn solid" style={{ position: 'relative' }} onClick={() => { fx('tap'); setSheet('held'); }} aria-label="Pesanan ditahan">
            <PauseCircle size={22} />{held.length > 0 && <span className="badge" style={{ position: 'absolute', top: -4, right: -4, background: 'var(--info)', color: '#fff' }}>{held.length}</span>}
          </button>
          <button className="icon-btn solid" onClick={() => { fx('tap'); setSheet('manual'); }} aria-label="Barang manual"><PenLine size={22} /></button>
        </>} />
      {products.length > 0 && <>
        <div className="pad" style={{ paddingBottom: 10, maxWidth: 'none' }}>
          <div className="search"><Search size={20} /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={`Cari ${biz.item.toLowerCase()}…`} />
            {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 12, top: 13 }}><X size={20} color="var(--muted)" /></button>}</div>
        </div>
        <div className="chips" style={{ paddingBottom: 10 }}>
          <button className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => { fx('tap'); setCat('all'); }}>Semua</button>
          {products.some(p => p.fav) && <button className={'chip' + (cat === 'fav' ? ' on' : '')} onClick={() => { fx('tap'); setCat('fav'); }}><Star size={15} /> Favorit</button>}
          {categories.map(k => <button key={k.id} className={'chip' + (cat === k.id ? ' on' : '')} onClick={() => { fx('tap'); setCat(k.id); }}><span style={{ width: 9, height: 9, borderRadius: 5, background: k.color }} />{k.name}</button>)}
        </div>
      </>}
      <div className="scroll" style={{ paddingBottom: !wide && cart.items.length ? 'calc(var(--safe-bottom) + 110px)' : 'calc(var(--safe-bottom) + 24px)' }}>
        {products.length === 0 ? (
          <Empty art={ArtBox} title={`Belum ada ${biz.item.toLowerCase()}`} text={`Tambahkan ${biz.item.toLowerCase()} yang Anda jual, atau coba dulu dengan contoh untuk usaha ${biz.name.toLowerCase()}.`}
            action={<div className="col gap8" style={{ maxWidth: 300, margin: '0 auto' }}>
              <button className="btn primary block" onClick={() => setEditP({})}><PackagePlus size={20} /> Tambah {biz.item}</button>
              <button className="btn soft block" onClick={() => { useStore.getState().loadSample(); fx('success'); toast('Contoh ditambahkan'); }}><Sparkles size={20} /> Pakai contoh {biz.emoji}</button>
              <button className="btn ghost block" onClick={() => setSheet('manual')}><PenLine size={20} /> Ketik manual</button>
            </div>} />
        ) : (
          <div className="pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, paddingTop: 6, maxWidth: 'none' }}>
            {list.map(p => <ProductTile key={p.id} p={p} count={counts[p.id] || 0} color={colorOf(p)} onAdd={add} low={p.stock != null && p.stock <= s.lowStock} />)}
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => { fx('tap'); setEditP({ catId: cat !== 'all' && cat !== 'fav' ? cat : null }); }}
              style={{ borderRadius: 20, border: '2px dashed var(--line)', minHeight: 148, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--muted)', fontWeight: 700 }}>
              <PackagePlus size={28} /> {biz.item} baru
            </motion.button>
            {list.length === 0 && <div className="muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20 }}>Tidak ada “{q}”. <button className="prim bold" onClick={() => setSheet('manual')}>Ketik manual</button></div>}
          </div>
        )}
      </div>

      <AnimatePresence>
        {!wide && cart.items.length > 0 && (
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
    </div>
  );

  return (
    <>
      {wide ? <div className="page cashier-split" style={{ flexDirection: 'row' }}>{catalogue}<CartPanel onEdit={setEdit} onWeigh={setWeigh} /></div> : catalogue}
      {!wide && <CartSheet open={sheet === 'cart'} onClose={() => setSheet(null)} onEdit={setEdit} onWeigh={setWeigh} />}
      <ManualSheet open={sheet === 'manual'} onClose={() => setSheet(null)} />
      <HeldSheet open={sheet === 'held'} onClose={() => setSheet(null)} />
      <LineSheet line={edit} onClose={() => setEdit(null)} />
      <WeighSheet target={weigh} onClose={() => setWeigh(null)} />
      <ProductSheet product={editP} onClose={() => setEditP(null)} />
    </>
  );
}
