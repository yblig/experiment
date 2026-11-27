import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2, Star, PackagePlus, Sparkles, Minus, Tags, X, CheckSquare, ArrowUpDown, MoreVertical, Tag, Boxes, EyeOff, Eye, Copy, PackageCheck, History, ClipboardCheck, FileDown, FileUp, Percent, Barcode, Layers, ArrowDownToLine } from 'lucide-react';
import { useStore, COLORS, UNITS, fmtQty, bizOf, isDec } from '../store.js';
import { nav, toast, confirmDialog } from '../ui.js';
import { rp, fmtDateTime, toDateInput } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { shareFile, toCsv, pickFile, readText } from '../lib/share.js';
import { Page, Header, Sheet, Field, MoneyInput, Toggle, Empty, NumInput, Seg, useSelection, useLongPress, CheckCircle, SelectHeader, ActionBar, ActionBtn } from '../components/ui.jsx';
import { ArtBox } from '../components/art.jsx';

const EMOJIS = ['🍛', '🍚', '🍜', '🍝', '🍗', '🍖', '🥩', '🍳', '🥚', '🍲', '🥣', '🍢', '🍡', '🥟', '🍔', '🌭', '🍕', '🥪', '🌮', '🍞', '🥐', '🍰', '🧁', '🍩', '🍪', '🍫', '🍬', '🍦', '🍧', '🍌', '🍊', '🍉', '🥭', '🥑', '🥔', '🌽', '🥬', '🌶️', '🧅', '🍘', '🥜', '☕', '🍵', '🧋', '🥤', '🧃', '🥛', '💧', '🍺', '🧊', '🥡', '📦', '🧴', '🧼', '🧻', '🪥', '💊', '🔋', '💡', '✂️', '👕', '👗', '👟', '💄', '📱', '🎁', '⛽', '🧺'];
const num = v => Number(String(v ?? '').replace(',', '.')) || 0;
const decIn = v => String(v).replace(/[^\d.,]/g, '').replace('.', ',');

// ---------- restock (stok masuk) ----------
export function RestockSheet({ product, onClose }) {
  const [qty, setQty] = useState(''); const [cost, setCost] = useState(0); const [exp, setExp] = useState(true); const [upd, setUpd] = useState(true);
  useEffect(() => { if (product) { setQty(''); setCost(0); setExp(true); setUpd(true); } }, [product]);
  const q = num(qty);
  const save = () => {
    useStore.getState().restock(product.id, q, { totalCost: cost, asExpense: exp, updateCost: upd });
    fx('success'); toast(`Stok ${product.name} +${fmtQty(q, product.unit)}${cost && exp ? ' · dicatat di pengeluaran' : ''}`); onClose();
  };
  return (
    <Sheet open={!!product} onClose={onClose} title="Stok masuk" footer={<button className="btn primary block lg" disabled={!q} onClick={save}><ArrowDownToLine size={20} /> Tambah stok</button>}>
      {product && <>
        <div className="card flat row"><span style={{ fontSize: 26 }}>{product.emoji || '📦'}</span><div className="grow"><div className="bold">{product.name}</div><div className="small muted">Stok sekarang: {fmtQty(product.stock ?? 0, product.unit)}</div></div></div>
        <div className="mt16"><Field label={`Jumlah masuk (${product.unit || 'pcs'})`}><input className="input num" inputMode="decimal" autoFocus value={qty} onChange={e => setQty(decIn(e.target.value))} placeholder="0" style={{ fontSize: '1.3rem', fontWeight: 800, textAlign: 'center', height: 60 }} /></Field></div>
        <div className="row gap8" style={{ flexWrap: 'wrap', marginTop: -4, marginBottom: 14 }}>{[1, 5, 10, 12, 24, 50].map(n => <button key={n} className="chip" onClick={() => setQty(String(n))}>{n}</button>)}</div>
        <Field label="Total harga beli (opsional)" hint={q && cost ? `= ${rp(Math.round(cost / q))} per ${product.unit || 'pcs'}` : 'Isi agar modal & pengeluaran ikut tercatat'}><MoneyInput value={cost} onChange={setCost} /></Field>
        {cost > 0 && <div className="list">
          <div className="li"><div className="grow"><div className="t">Catat sebagai pengeluaran</div><div className="s">Masuk ke Keuangan → Belanja Bahan</div></div><Toggle on={exp} onChange={setExp} /></div>
          <div className="li"><div className="grow"><div className="t">Perbarui harga modal</div><div className="s">Modal per barang jadi {q ? rp(Math.round(cost / q)) : '-'}</div></div><Toggle on={upd} onChange={setUpd} /></div>
        </div>}
      </>}
    </Sheet>
  );
}

// ---------- product form ----------
export function ProductSheet({ product, onClose }) {
  const categories = useStore(s => s.categories);
  const [f, setF] = useState(null);
  const [emo, setEmo] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [restock, setRestock] = useState(null);
  useEffect(() => { if (product) { setNewCat(''); setF({ name: '', price: 0, cost: 0, catId: categories[0]?.id || null, emoji: '', stock: null, fav: false, hidden: false, sku: '', wsMin: 0, wsPrice: 0, unit: useStore.getState().settings.bizType === 'laundry' ? 'kg' : 'pcs', ...product }); setEmo(false); } }, [product]);
  const isEdit = !!product?.id;
  const live = useStore(s => (product?.id ? s.products.find(p => p.id === product.id) : null));
  const save = () => {
    if (!f.name.trim()) { fx('error'); toast('Nama produk belum diisi', { type: 'error' }); return; }
    const { stock, ...rest } = f;
    const st = useStore.getState();
    const name = f.name.trim(), sku = (f.sku || '').trim();
    if (!isEdit) st.saveProduct({ ...rest, name, sku, stock });
    else {
      st.saveProduct({ ...rest, name, sku });
      const cur = live?.stock ?? null;
      if (stock == null) { if (cur != null) st.saveProduct({ id: f.id, stock: null }); }
      else if (cur == null) st.saveProduct({ id: f.id, stock });
      else if (stock !== cur) st.adjustStock(f.id, stock - cur, 'adjust', 'Diubah manual');
    }
    fx('success'); toast(isEdit ? 'Produk disimpan' : `${f.name.trim()} ditambahkan`); onClose();
  };
  const del = async () => {
    if (!(await confirmDialog({ title: `Hapus ${f.name}?`, message: 'Riwayat penjualan produk ini tetap tersimpan.', ok: 'Hapus', danger: true }))) return;
    const removed = useStore.getState().deleteProducts([f.id]); fx('remove'); onClose();
    toast('Produk dihapus', { action: { label: 'URUNGKAN', fn: () => useStore.getState().restoreProducts(removed) } });
  };
  const dup = () => { const c = useStore.getState().duplicateProduct(f.id); fx('success'); toast(`Disalin: ${c.name}`); onClose(); };
  const profit = f ? f.price - (f.cost || 0) : 0;
  return (
    <>
      <Sheet open={!!product} onClose={onClose} title={isEdit ? 'Ubah produk' : 'Produk baru'} full
        right={isEdit ? <button className="icon-btn" onClick={dup} aria-label="Duplikat"><Copy size={20} /></button> : null}
        footer={<div className="row gap12">
          {isEdit && <button className="btn outline" style={{ color: 'var(--expense)', width: 60, padding: 0 }} onClick={del}><Trash2 size={20} /></button>}
          <button className="btn primary lg grow" onClick={save}>Simpan produk</button>
        </div>}>
        {f && <>
          <div className="row gap12" style={{ alignItems: 'flex-end' }}>
            <button onClick={() => setEmo(!emo)} style={{ width: 70, height: 70, borderRadius: 22, background: 'var(--surface)', boxShadow: 'var(--shadow)', fontSize: 36, flex: 'none', marginBottom: 14, display: 'grid', placeItems: 'center' }}>
              {f.emoji || <span className="tiny bold muted">Ikon</span>}
            </button>
            <div className="grow"><Field label="Nama produk"><input className="input" autoFocus={!isEdit} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Contoh: Nasi Goreng" /></Field></div>
          </div>
          {emo && (
            <div className="card" style={{ padding: 10, marginBottom: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 4 }}>
              <button onClick={() => { setF({ ...f, emoji: '' }); setEmo(false); }} style={{ height: 44, borderRadius: 12, background: 'var(--bg2)' }}><X size={18} /></button>
              {EMOJIS.map(e => <button key={e} onClick={() => { fx('tap'); setF({ ...f, emoji: e }); setEmo(false); }} style={{ height: 44, fontSize: 26, borderRadius: 12, background: f.emoji === e ? 'var(--primary-soft)' : 'transparent' }}>{e}</button>)}
            </div>
          )}
          <div className="row gap12">
            <div className="grow"><Field label={f.unit && f.unit !== 'pcs' ? `Harga jual / ${f.unit}` : 'Harga jual'}><MoneyInput value={f.price} onChange={v => setF({ ...f, price: v })} /></Field></div>
            <div className="grow"><Field label="Harga modal"><MoneyInput value={f.cost} onChange={v => setF({ ...f, cost: v })} /></Field></div>
          </div>
          {f.price > 0 && f.cost > 0 && <div className="small bold" style={{ marginTop: -6, marginBottom: 12, color: profit >= 0 ? 'var(--income)' : 'var(--expense)' }}>Untung {rp(profit)} per {f.unit && f.unit !== 'pcs' ? f.unit : 'barang'} ({Math.round(profit / f.price * 100)}%)</div>}
          <Field label="Dihitung per (satuan)" hint={isDec(f.unit) ? 'Saat di kasir, Anda bisa mengetik berat/jumlah desimal, misal 3,5' : null}>
            <div className="row gap8" style={{ flexWrap: 'wrap' }}>
              {UNITS.map(u => <button key={u.id} className={'chip' + ((f.unit || 'pcs') === u.id ? ' on' : '')} onClick={() => { fx('tap'); setF({ ...f, unit: u.id }); }}>{u.name}{u.dec ? ' ⚖️' : ''}</button>)}
            </div>
          </Field>
          <Field label="Kategori">
            <div className="row gap8" style={{ flexWrap: 'wrap' }}>
              <button className={'chip' + (!f.catId ? ' on' : '')} onClick={() => setF({ ...f, catId: null })}>Tanpa kategori</button>
              {categories.map(c => <button key={c.id} className={'chip' + (f.catId === c.id ? ' on' : '')} onClick={() => { fx('tap'); setF({ ...f, catId: c.id }); }}><span style={{ width: 9, height: 9, borderRadius: 5, background: c.color }} />{c.name}</button>)}
              {!newCat && <button className="chip" onClick={() => setNewCat(' ')}><Plus size={15} /> Kategori baru</button>}
            </div>
            {newCat && <div className="row gap8 mt8">
              <input className="input" autoFocus value={newCat.trimStart()} onChange={e => setNewCat(e.target.value || ' ')} placeholder="Nama kategori" />
              <button className="btn primary sm" style={{ height: 54 }} onClick={() => {
                const name = newCat.trim(); if (!name) return;
                const st = useStore.getState(); st.saveCategory({ name, color: COLORS[st.categories.length % COLORS.length] });
                const c = useStore.getState().categories.slice(-1)[0]; setF({ ...f, catId: c.id }); setNewCat(''); fx('success');
              }}>Tambah</button>
            </div>}
          </Field>
          <Field label="Kode barang / barcode (opsional)" hint="Bisa dicari di kasir dengan mengetik kodenya">
            <div className="input-wrap"><span className="prefix"><Barcode size={18} /></span><input className="input" value={f.sku || ''} onChange={e => setF({ ...f, sku: e.target.value })} placeholder="Contoh: BRS-01 atau 8991234567890" /></div>
          </Field>

          <div className="card flat">
            <div className="row"><div className="grow"><div className="bold">Hitung stok</div><div className="tiny muted">Stok berkurang otomatis saat terjual</div></div><Toggle on={f.stock != null} onChange={on => setF({ ...f, stock: on ? (live?.stock ?? 0) : null })} /></div>
            {f.stock != null && <div className="row gap8 mt12">
              <button className="icon-btn solid" onClick={() => setF({ ...f, stock: Math.max(0, Math.round((f.stock - 1) * 100) / 100) })}><Minus size={20} /></button>
              <NumInput value={String(f.stock).replace('.', ',')} onChange={v => setF({ ...f, stock: Math.max(0, num(v)) })} style={{ textAlign: 'center' }} />
              <button className="icon-btn solid" onClick={() => setF({ ...f, stock: Math.round((f.stock + 1) * 100) / 100 })}><Plus size={20} /></button>
            </div>}
            {isEdit && live?.stock != null && <div className="row gap8 mt8">
              <button className="btn sm soft grow" onClick={() => setRestock(live)}><ArrowDownToLine size={17} /> Stok masuk</button>
              <button className="btn sm outline grow" onClick={() => { onClose(); nav.push('stockLog', { pid: f.id }); }}><History size={17} /> Riwayat stok</button>
            </div>}
            <div className="divider" />
            <div className="row"><div className="grow"><div className="bold">Harga grosir</div><div className="tiny muted">Harga lebih murah jika beli banyak</div></div><Toggle on={!!f.wsMin} onChange={on => setF({ ...f, wsMin: on ? 10 : 0, wsPrice: on ? (f.wsPrice || Math.round(f.price * 0.9)) : 0 })} /></div>
            {!!f.wsMin && <div className="row gap12 mt12">
              <div style={{ width: 120 }}><Field label={`Mulai (${f.unit || 'pcs'})`}><NumInput value={f.wsMin} onChange={v => setF({ ...f, wsMin: Math.max(1, num(v)) })} /></Field></div>
              <div className="grow"><Field label="Harga grosir"><MoneyInput value={f.wsPrice} onChange={v => setF({ ...f, wsPrice: v })} /></Field></div>
            </div>}
            <div className="divider" />
            <div className="row"><div className="grow"><div className="bold">Produk favorit</div><div className="tiny muted">Tampil paling depan di kasir</div></div><Toggle on={f.fav} onChange={v => setF({ ...f, fav: v })} /></div>
            <div className="divider" />
            <div className="row"><div className="grow"><div className="bold">Sembunyikan dari kasir</div><div className="tiny muted">Untuk barang yang sedang tidak dijual</div></div><Toggle on={!!f.hidden} onChange={v => setF({ ...f, hidden: v })} /></div>
          </div>
        </>}
      </Sheet>
      <RestockSheet product={restock} onClose={() => setRestock(null)} />
    </>
  );
}

// ---------- bulk edit sheets ----------
function BulkSheet({ mode, ids, onClose, onDone }) {
  const categories = useStore(s => s.categories);
  const products = useStore(s => s.products);
  const chosen = products.filter(p => ids.includes(p.id));
  const [priceMode, setPriceMode] = useState('pct'); const [dir, setDir] = useState('up'); const [val, setVal] = useState('');
  const [stockMode, setStockMode] = useState('add');
  useEffect(() => { setVal(''); setPriceMode('pct'); setDir('up'); setStockMode('add'); }, [mode]);
  const st = useStore.getState();
  const n = chosen.length;
  const done = msg => { fx('success'); toast(msg); onDone(); onClose(); };
  const v = num(val);
  const newPrice = p => {
    if (priceMode === 'set') return Math.round(v);
    const d = priceMode === 'pct' ? p.price * v / 100 : v;
    const x = dir === 'up' ? p.price + d : p.price - d;
    return Math.max(0, Math.round(x / 100) * 100 || Math.round(x));
  };
  const title = { cat: 'Pindah kategori', price: 'Ubah harga', stock: 'Ubah stok', more: 'Aksi lainnya' }[mode] || '';
  return (
    <Sheet open={!!mode} onClose={onClose} title={`${title} · ${n} produk`}
      footer={mode === 'price' ? <button className="btn primary block lg" disabled={!v} onClick={() => { st.bulkProducts(ids, p => ({ price: newPrice(p) })); done(`Harga ${n} produk diperbarui`); }}>Terapkan ke {n} produk</button>
        : mode === 'stock' ? <button className="btn primary block lg" disabled={val === ''} onClick={() => { st.bulkStock(ids, stockMode, v); done(`Stok ${n} produk diperbarui`); }}>Terapkan ke {n} produk</button> : null}>
      {mode === 'cat' && <div className="list">
        <button className="li" onClick={() => { st.bulkProducts(ids, () => ({ catId: null })); done(`${n} produk tanpa kategori`); }}><div className="ic" style={{ background: 'var(--bg2)' }}><Tag size={20} /></div><div className="grow t">Tanpa kategori</div></button>
        {categories.map(c => <button key={c.id} className="li" onClick={() => { st.bulkProducts(ids, () => ({ catId: c.id })); done(`${n} produk dipindah ke ${c.name}`); }}><div className="ic" style={{ background: c.color, color: '#fff' }}><Tags size={20} /></div><div className="grow t">{c.name}</div></button>)}
      </div>}
      {mode === 'price' && <>
        <Seg value={priceMode} onChange={setPriceMode} options={[{ value: 'pct', label: 'Persen %' }, { value: 'rp', label: 'Rupiah' }, { value: 'set', label: 'Samakan' }]} />
        {priceMode !== 'set' && <div className="mt12"><Seg value={dir} onChange={setDir} options={[{ value: 'up', label: '⬆ Naikkan' }, { value: 'down', label: '⬇ Turunkan' }]} /></div>}
        <div className="mt12">{priceMode === 'pct' ? <Field label="Berapa persen?"><NumInput value={val} onChange={setVal} placeholder="10" /></Field> : <Field label={priceMode === 'set' ? 'Harga baru untuk semua' : 'Berapa rupiah?'}><MoneyInput value={v} onChange={x => setVal(String(x))} /></Field>}</div>
        {v > 0 && <div className="card flat" style={{ maxHeight: 220, overflowY: 'auto' }}>
          {chosen.slice(0, 30).map(p => <div key={p.id} className="kv small"><span className="ellipsis" style={{ maxWidth: '55%' }}>{p.name}</span><span className="num">{rp(p.price)} → <b style={{ color: 'var(--text)' }}>{rp(newPrice(p))}</b></span></div>)}
        </div>}
        <div className="tiny muted mt8">Hasil dibulatkan ke ratusan terdekat.</div>
      </>}
      {mode === 'stock' && <>
        <Seg value={stockMode} onChange={setStockMode} options={[{ value: 'add', label: '+ Tambah' }, { value: 'sub', label: '− Kurangi' }, { value: 'set', label: '= Jadikan' }]} />
        <div className="mt12"><Field label={stockMode === 'set' ? 'Stok menjadi' : 'Jumlah'} hint="Produk yang belum dihitung stoknya akan mulai dihitung"><input className="input num" inputMode="decimal" autoFocus value={val} onChange={e => setVal(decIn(e.target.value))} placeholder="0" style={{ fontSize: '1.3rem', fontWeight: 800, textAlign: 'center', height: 60 }} /></Field></div>
        <div className="row gap8" style={{ flexWrap: 'wrap' }}>{[1, 5, 10, 24, 50, 100].map(x => <button key={x} className="chip" onClick={() => setVal(String(x))}>{x}</button>)}</div>
      </>}
      {mode === 'more' && <div className="list">
        <button className="li" onClick={() => { st.bulkProducts(ids, () => ({ fav: true })); done(`${n} produk jadi favorit`); }}><div className="ic" style={{ background: 'var(--accent-soft)', color: '#C27C00' }}><Star size={20} /></div><div className="grow t">Jadikan favorit</div></button>
        <button className="li" onClick={() => { st.bulkProducts(ids, () => ({ fav: false })); done('Favorit dilepas'); }}><div className="ic" style={{ background: 'var(--bg2)' }}><Star size={20} /></div><div className="grow t">Lepas dari favorit</div></button>
        <button className="li" onClick={() => { st.bulkProducts(ids, () => ({ hidden: true })); done(`${n} produk disembunyikan dari kasir`); }}><div className="ic" style={{ background: 'var(--bg2)' }}><EyeOff size={20} /></div><div className="grow t">Sembunyikan dari kasir</div></button>
        <button className="li" onClick={() => { st.bulkProducts(ids, () => ({ hidden: false })); done(`${n} produk ditampilkan di kasir`); }}><div className="ic" style={{ background: 'var(--income-soft)', color: 'var(--income)' }}><Eye size={20} /></div><div className="grow t">Tampilkan di kasir</div></button>
        <button className="li" onClick={() => { st.bulkProducts(ids, () => ({ stock: null })); done('Stok tidak dihitung lagi'); }}><div className="ic" style={{ background: 'var(--bg2)' }}><Boxes size={20} /></div><div className="grow t">Berhenti menghitung stok</div></button>
        <button className="li" onClick={() => { ids.forEach(id => st.duplicateProduct(id)); done(`${n} produk disalin`); }}><div className="ic" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}><Copy size={20} /></div><div className="grow t">Duplikat (salin)</div></button>
        <button className="li" onClick={() => { exportProducts(chosen); onClose(); }}><div className="ic" style={{ background: 'var(--income-soft)', color: 'var(--income)' }}><FileDown size={20} /></div><div className="grow t">Ekspor yang dipilih (Excel/CSV)</div></button>
      </div>}
    </Sheet>
  );
}

// ---------- CSV ----------
const HEAD = ['Nama', 'Harga', 'Modal', 'Stok', 'Satuan', 'Kategori', 'Kode'];
export async function exportProducts(list) {
  const cats = useStore.getState().categories;
  const rows = [HEAD, ...list.map(p => [p.name, p.price, p.cost || 0, p.stock == null ? '' : String(p.stock).replace('.', ','), p.unit || 'pcs', cats.find(c => c.id === p.catId)?.name || '', p.sku || ''])];
  try { await shareFile(`produk-${toDateInput(Date.now())}.csv`, toCsv(rows), { mime: 'text/csv', title: 'Ekspor produk' }); fx('success'); }
  catch (e) { if (!/cancel|abort/i.test(e?.message || '')) toast('Gagal ekspor', { type: 'error' }); }
}
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const d = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === d) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}
async function importProducts() {
  const f = await pickFile('.csv,text/csv,text/plain'); if (!f) return;
  try {
    const rows = parseCsv(await readText(f));
    if (rows.length < 2) throw new Error('File kosong');
    const h = rows[0].map(x => x.trim().toLowerCase());
    const col = (...names) => h.findIndex(x => names.some(n => x.startsWith(n)));
    const ci = { name: col('nama', 'name', 'produk', 'barang'), price: col('harga jual', 'harga', 'price'), cost: col('modal', 'harga modal', 'cost'), stock: col('stok', 'stock'), unit: col('satuan', 'unit'), category: col('kategori', 'category'), sku: col('kode', 'sku', 'barcode') };
    if (ci.name < 0) throw new Error('Kolom "Nama" tidak ditemukan');
    const money = v => Number(String(v || '').replace(/[^\d]/g, '')) || 0;
    const data = rows.slice(1).map(r => ({
      name: (r[ci.name] || '').trim(), price: ci.price >= 0 ? money(r[ci.price]) : 0, cost: ci.cost >= 0 ? money(r[ci.cost]) : 0,
      stock: ci.stock >= 0 && String(r[ci.stock] || '').trim() !== '' ? num(r[ci.stock]) : null,
      unit: ci.unit >= 0 ? (UNITS.find(u => u.id === String(r[ci.unit] || '').trim().toLowerCase())?.id || 'pcs') : 'pcs',
      category: ci.category >= 0 ? (r[ci.category] || '').trim() : '', sku: ci.sku >= 0 ? (r[ci.sku] || '').trim() : ''
    }));
    const res = useStore.getState().importProducts(data);
    fx('success'); toast(`Impor selesai: ${res.added} baru, ${res.updated} diperbarui`);
  } catch (e) { fx('error'); toast(e.message || 'File tidak bisa dibaca', { type: 'error' }); }
}

// ---------- products list ----------
const SORTS = [['name', 'Nama A–Z'], ['priceAsc', 'Harga termurah'], ['priceDesc', 'Harga termahal'], ['stockAsc', 'Stok paling sedikit'], ['sold', 'Paling laris'], ['new', 'Terbaru']];

function ProductRow({ p, cat, low, sel, onOpen }) {
  const lp = useLongPress(() => { if (!sel.on) sel.start(p.id); });
  const isLow = p.stock != null && p.stock <= low;
  const picked = sel.has(p.id);
  return (
    <div className="li" style={{ background: picked ? 'var(--primary-soft)' : undefined, opacity: p.hidden && !picked ? 0.6 : 1 }}>
      <button className="row grow" style={{ gap: 14, minWidth: 0, textAlign: 'left' }} {...lp}
        onClick={() => { if (lp.wasLong()) return; if (sel.on) sel.toggle(p.id); else { fx('tap'); onOpen(p); } }}>
        {sel.on && <CheckCircle on={picked} />}
        <div className="ic" style={{ background: `color-mix(in srgb, ${cat?.color || '#0E7C66'} 15%, var(--surface))`, fontSize: 22 }}>{p.emoji || <b style={{ color: cat?.color }}>{p.name.slice(0, 2).toUpperCase()}</b>}</div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="t ellipsis">{p.fav ? '⭐ ' : ''}{p.name}{p.hidden ? <span className="tag gray" style={{ marginLeft: 6 }}>Disembunyikan</span> : null}</div>
          <div className="s num ellipsis">{rp(p.price)}{p.unit && p.unit !== 'pcs' ? '/' + p.unit : ''}{p.cost ? <span className="green"> · untung {rp(p.price - p.cost)}</span> : ''}{p.wsMin ? <span className="prim"> · grosir</span> : ''} · terjual {fmtQty(p.sold || 0, p.unit)}{p.sku ? ` · ${p.sku}` : ''}</div>
        </div>
      </button>
      {!sel.on && (p.stock != null ? (
        <div className="row" style={{ gap: 4 }}>
          <button className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => { fx('tap'); useStore.getState().adjustStock(p.id, -1); }}><Minus size={18} /></button>
          <span className={'tag ' + (p.stock <= 0 ? 'red' : isLow ? 'amber' : 'gray')} style={{ minWidth: 44, justifyContent: 'center', fontSize: '.85rem' }}>{fmtQty(p.stock)}</span>
          <button className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => { fx('add'); useStore.getState().adjustStock(p.id, 1); }}><Plus size={18} /></button>
        </div>
      ) : <span className="tiny muted">∞</span>)}
    </div>
  );
}

export function Products({ filter: initFilter = 'all' }) {
  const products = useStore(s => s.products); const categories = useStore(s => s.categories); const low = useStore(s => s.settings.lowStock);
  const [q, setQ] = useState(''); const [filter, setFilter] = useState(initFilter);
  const [sort, setSort] = useState('name');
  const [edit, setEdit] = useState(null);
  const [bulk, setBulk] = useState(null);
  const [menu, setMenu] = useState(null);
  const sel = useSelection();
  const list = useMemo(() => {
    let l = products;
    if (filter === 'low') l = l.filter(p => p.stock != null && p.stock <= low);
    else if (filter === 'fav') l = l.filter(p => p.fav);
    else if (filter === 'hidden') l = l.filter(p => p.hidden);
    else if (filter !== 'all') l = l.filter(p => p.catId === filter);
    if (q.trim()) { const t = q.trim().toLowerCase(); l = l.filter(p => p.name.toLowerCase().includes(t) || (p.sku || '').toLowerCase().includes(t)); }
    const cmp = { name: (a, b) => a.name.localeCompare(b.name), priceAsc: (a, b) => a.price - b.price, priceDesc: (a, b) => b.price - a.price, stockAsc: (a, b) => (a.stock ?? 1e9) - (b.stock ?? 1e9), sold: (a, b) => (b.sold || 0) - (a.sold || 0), new: (a, b) => (b.created || 0) - (a.created || 0) }[sort];
    return [...l].sort(cmp);
  }, [products, filter, q, low, sort]);
  const lowCount = products.filter(p => p.stock != null && p.stock <= low).length;
  const hiddenCount = products.filter(p => p.hidden).length;
  const ids = sel.ids();
  const delSelected = async () => {
    if (!(await confirmDialog({ title: `Hapus ${ids.length} produk?`, message: 'Riwayat penjualan tetap tersimpan. Anda bisa mengurungkan setelah menghapus.', ok: `Hapus ${ids.length} produk`, danger: true }))) return;
    const removed = useStore.getState().deleteProducts(ids); fx('remove'); sel.clear();
    toast(`${removed.length} produk dihapus`, { action: { label: 'URUNGKAN', fn: () => useStore.getState().restoreProducts(removed) } });
  };

  return (
    <div className="page">
      {sel.on ? <SelectHeader selection={sel} allIds={list.map(p => p.id)} label="produk dipilih" />
        : <Header title="Produk & Stok" sub={`${products.length} produk · tekan lama untuk pilih banyak`}
          right={products.length > 0 ? <>
            <button className="icon-btn solid" onClick={() => sel.start()} aria-label="Pilih banyak"><CheckSquare size={21} /></button>
            <button className="icon-btn solid" onClick={() => setMenu('more')} aria-label="Lainnya"><MoreVertical size={21} /></button>
          </> : null} />}
      <div className="scroll" style={{ paddingBottom: 'calc(var(--safe-bottom) + 110px)' }}>
        {products.length === 0 ? (
          <Empty art={ArtBox} title="Belum ada produk" text="Tambahkan barang dagangan Anda, atau impor dari file Excel (CSV)."
            action={<div className="col gap8" style={{ maxWidth: 300, margin: '0 auto' }}>
              <button className="btn primary" onClick={() => setEdit({})}><PackagePlus size={20} /> Tambah Produk</button>
              <button className="btn soft" onClick={() => { useStore.getState().loadSample(); fx('success'); }}><Sparkles size={20} /> Pakai contoh {bizOf(useStore.getState().settings.bizType).name.toLowerCase()}</button>
              <button className="btn ghost" onClick={importProducts}><FileUp size={20} /> Impor dari file CSV</button>
            </div>} />
        ) : <>
          <div className="pad" style={{ paddingBottom: 10 }}><div className="row gap8">
            <div className="search grow"><Search size={20} /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama atau kode…" /></div>
            <button className="icon-btn solid" style={{ height: 50, width: 50 }} onClick={() => setMenu('sort')} aria-label="Urutkan"><ArrowUpDown size={21} /></button>
          </div></div>
          <div className="chips" style={{ paddingBottom: 12 }}>
            <button className={'chip' + (filter === 'all' ? ' on' : '')} onClick={() => setFilter('all')}>Semua</button>
            <button className={'chip' + (filter === 'low' ? ' on' : '')} onClick={() => setFilter('low')}>Stok menipis {lowCount > 0 && <span className="badge" style={{ background: 'var(--expense)', color: '#fff', height: 20 }}>{lowCount}</span>}</button>
            <button className={'chip' + (filter === 'fav' ? ' on' : '')} onClick={() => setFilter('fav')}><Star size={14} /> Favorit</button>
            {hiddenCount > 0 && <button className={'chip' + (filter === 'hidden' ? ' on' : '')} onClick={() => setFilter('hidden')}><EyeOff size={14} /> Disembunyikan</button>}
            {categories.map(c => <button key={c.id} className={'chip' + (filter === c.id ? ' on' : '')} onClick={() => setFilter(c.id)}><span style={{ width: 9, height: 9, borderRadius: 5, background: c.color }} />{c.name}</button>)}
          </div>
          <div className="pad">
            {sort !== 'name' && <div className="small muted bold" style={{ margin: '0 4px 8px' }}>Diurutkan: {SORTS.find(x => x[0] === sort)[1]}</div>}
            <div className="list">
              {list.map(p => <ProductRow key={p.id} p={p} cat={categories.find(c => c.id === p.catId)} low={low} sel={sel} onOpen={setEdit} />)}
            </div>
            {list.length === 0 && <div className="empty"><p>Tidak ada produk di sini.</p></div>}
          </div>
        </>}
      </div>

      {!sel.on && products.length > 0 && (
        <div className="fab-row" style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(var(--safe-bottom) + 14px)', zIndex: 5 }}>
          <button className="btn primary block lg" onClick={() => setEdit({})}><PackagePlus size={20} /> Tambah Produk</button>
        </div>
      )}
      <ActionBar show={sel.on}>
        <ActionBtn icon={Trash2} label="Hapus" danger disabled={!ids.length} onClick={delSelected} />
        <ActionBtn icon={Tags} label="Kategori" disabled={!ids.length} onClick={() => setBulk('cat')} />
        <ActionBtn icon={Percent} label="Harga" disabled={!ids.length} onClick={() => setBulk('price')} />
        <ActionBtn icon={Boxes} label="Stok" disabled={!ids.length} onClick={() => setBulk('stock')} />
        <ActionBtn icon={Layers} label="Lainnya" disabled={!ids.length} onClick={() => setBulk('more')} />
      </ActionBar>

      <ProductSheet product={edit} onClose={() => setEdit(null)} />
      <BulkSheet mode={bulk} ids={ids} onClose={() => setBulk(null)} onDone={() => sel.clear()} />
      <Sheet open={menu === 'sort'} onClose={() => setMenu(null)} title="Urutkan produk">
        <div className="list">{SORTS.map(([k, l]) => <button key={k} className="li" onClick={() => { fx('tap'); setSort(k); setMenu(null); }}><div className="grow t">{l}</div>{sort === k && <span className="tag green">Dipakai</span>}</button>)}</div>
      </Sheet>
      <Sheet open={menu === 'more'} onClose={() => setMenu(null)} title="Lainnya">
        <div className="list">
          <button className="li" onClick={() => { setMenu(null); sel.start(); }}><div className="ic" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}><CheckSquare size={21} /></div><div className="grow"><div className="t">Pilih banyak produk</div><div className="s">Hapus, ubah harga/stok/kategori sekaligus</div></div></button>
          <button className="li" onClick={() => { setMenu(null); nav.push('opname'); }}><div className="ic" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}><ClipboardCheck size={21} /></div><div className="grow"><div className="t">Stok opname</div><div className="s">Hitung ulang stok fisik di toko</div></div></button>
          <button className="li" onClick={() => { setMenu(null); nav.push('stockLog'); }}><div className="ic" style={{ background: 'var(--accent-soft)', color: '#C27C00' }}><History size={21} /></div><div className="grow"><div className="t">Riwayat stok</div><div className="s">Stok masuk, terjual, opname</div></div></button>
          <button className="li" onClick={() => { setMenu(null); exportProducts(products); }}><div className="ic" style={{ background: 'var(--income-soft)', color: 'var(--income)' }}><FileDown size={21} /></div><div className="grow"><div className="t">Ekspor semua produk</div><div className="s">File CSV untuk Excel / Google Sheets</div></div></button>
          <button className="li" onClick={() => { setMenu(null); importProducts(); }}><div className="ic" style={{ background: 'var(--income-soft)', color: 'var(--income)' }}><FileUp size={21} /></div><div className="grow"><div className="t">Impor dari file CSV</div><div className="s">Kolom: {HEAD.join(', ')}</div></div></button>
          <button className="li" onClick={() => { setMenu(null); nav.push('categories'); }}><div className="ic" style={{ background: 'color-mix(in srgb, #8E5BD8 14%, var(--surface))', color: '#8E5BD8' }}><Tags size={21} /></div><div className="grow"><div className="t">Kelola kategori</div></div></button>
        </div>
      </Sheet>
    </div>
  );
}

// ---------- stock count (opname) ----------
export function Opname() {
  const products = useStore(s => s.products.filter(p => p.stock != null));
  const [vals, setVals] = useState({}); const [q, setQ] = useState('');
  const changed = products.filter(p => vals[p.id] !== undefined && vals[p.id] !== '' && num(vals[p.id]) !== p.stock);
  const list = products.filter(p => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()));
  const save = async () => {
    if (!(await confirmDialog({ title: `Simpan ${changed.length} perubahan stok?`, message: 'Stok di aplikasi disamakan dengan hasil hitungan. Selisih dicatat di Riwayat stok.', ok: 'Simpan', icon: ClipboardCheck }))) return;
    const n = useStore.getState().opname(changed.map(p => ({ id: p.id, actual: num(vals[p.id]) })));
    fx('success'); toast(`Stok opname selesai · ${n} produk disesuaikan`); nav.pop();
  };
  return (
    <Page title="Stok Opname" sub="Isi jumlah fisik yang ada di toko"
      footer={<button className="btn primary block lg" disabled={!changed.length} onClick={save}><ClipboardCheck size={20} /> Simpan {changed.length ? `(${changed.length} berubah)` : ''}</button>}>
      {products.length === 0 ? <Empty art={ArtBox} title="Belum ada produk dengan stok" text="Aktifkan “Hitung stok” di produk terlebih dahulu." /> : <>
        <div className="search" style={{ marginBottom: 12 }}><Search size={20} /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari produk…" /></div>
        <div className="list">
          {list.map(p => {
            const v = vals[p.id]; const diff = v !== undefined && v !== '' ? Math.round((num(v) - p.stock) * 100) / 100 : null;
            return (
              <div key={p.id} className="li">
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="t ellipsis">{p.emoji ? p.emoji + ' ' : ''}{p.name}</div>
                  <div className="s">Di aplikasi: <b>{fmtQty(p.stock, p.unit)}</b>{diff ? <b className={diff > 0 ? 'green' : 'red'}> · selisih {diff > 0 ? '+' : ''}{fmtQty(diff)}</b> : diff === 0 ? <span className="green"> · cocok ✓</span> : null}</div>
                </div>
                <input className="input num" inputMode="decimal" style={{ width: 96, textAlign: 'center', fontWeight: 800 }} placeholder={String(p.stock).replace('.', ',')} value={v ?? ''} onChange={e => setVals({ ...vals, [p.id]: decIn(e.target.value) })} />
              </div>
            );
          })}
        </div>
      </>}
    </Page>
  );
}

// ---------- stock history ----------
const LOG_T = { in: ['Stok masuk', 'green'], sale: ['Terjual', 'gray'], opname: ['Opname', 'blue'], adjust: ['Diubah', 'amber'], void: ['Batal jual', 'blue'] };
export function StockLog({ pid }) {
  const log = useStore(s => s.stockLog || []); const products = useStore(s => s.products);
  const [type, setType] = useState('all');
  const p = pid && products.find(x => x.id === pid);
  const list = log.filter(e => (!pid || e.pid === pid) && (type === 'all' || e.type === type)).slice(0, 300);
  return (
    <Page title="Riwayat Stok" sub={p ? p.name : 'Semua produk'} noPad>
      <div className="chips" style={{ paddingBottom: 12 }}>
        {[['all', 'Semua'], ['in', 'Stok masuk'], ['sale', 'Terjual'], ['opname', 'Opname'], ['adjust', 'Diubah']].map(([k, l]) => <button key={k} className={'chip' + (type === k ? ' on' : '')} onClick={() => setType(k)}>{l}</button>)}
      </div>
      <div className="pad">
        {list.length === 0 ? <Empty art={ArtBox} title="Belum ada riwayat" text="Perubahan stok (masuk, terjual, opname) akan tercatat di sini." /> : (
          <div className="list">
            {list.map(e => { const [l, c] = LOG_T[e.type] || ['', 'gray']; return (
              <div key={e.id} className="li">
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="t ellipsis">{e.name}</div>
                  <div className="s">{fmtDateTime(e.date)}{e.note ? ` · ${e.note}` : ''}</div>
                </div>
                <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                  <b className={'num ' + (e.delta > 0 ? 'green' : e.delta < 0 ? 'red' : '')}>{e.delta > 0 ? '+' : ''}{fmtQty(e.delta, e.unit)}</b>
                  <span className={'tag ' + c}>{l} · sisa {fmtQty(e.after)}</span>
                </div>
              </div>
            ); })}
          </div>
        )}
      </div>
    </Page>
  );
}

export function Categories() {
  const categories = useStore(s => s.categories); const products = useStore(s => s.products);
  const [edit, setEdit] = useState(null);
  const [f, setF] = useState({ name: '', color: COLORS[0] });
  useEffect(() => { if (edit) setF({ name: '', color: COLORS[categories.length % COLORS.length], ...edit }); }, [edit]);
  const save = () => { if (!f.name.trim()) return; useStore.getState().saveCategory({ ...f, name: f.name.trim() }); fx('success'); setEdit(null); };
  const del = async () => {
    if (!(await confirmDialog({ title: `Hapus kategori ${f.name}?`, message: 'Produk di kategori ini tidak ikut terhapus.', ok: 'Hapus', danger: true }))) return;
    useStore.getState().deleteCategory(f.id); fx('remove'); setEdit(null);
  };
  return (
    <Page title="Kategori Produk" right={<button className="icon-btn solid" onClick={() => setEdit({})}><Plus size={22} /></button>}>
      {categories.length === 0 ? <Empty art={ArtBox} title="Belum ada kategori" text="Kelompokkan produk, misalnya Makanan, Minuman, Camilan." action={<button className="btn primary" onClick={() => setEdit({})}><Tags size={20} /> Buat Kategori</button>} /> : (
        <div className="list">
          {categories.map(c => (
            <button key={c.id} className="li" onClick={() => { fx('tap'); setEdit(c); }}>
              <div className="ic" style={{ background: c.color, color: '#fff' }}><Tags size={20} /></div>
              <div className="grow"><div className="t">{c.name}</div><div className="s">{products.filter(p => p.catId === c.id).length} produk</div></div>
            </button>
          ))}
        </div>
      )}
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Ubah kategori' : 'Kategori baru'}
        footer={<div className="row gap12">{edit?.id && <button className="btn outline" style={{ color: 'var(--expense)', width: 60, padding: 0 }} onClick={del}><Trash2 size={20} /></button>}<button className="btn primary grow" disabled={!f.name.trim()} onClick={save}>Simpan</button></div>}>
        <Field label="Nama kategori"><input className="input" autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Contoh: Minuman" /></Field>
        <Field label="Warna">
          <div className="row gap8" style={{ flexWrap: 'wrap' }}>
            {COLORS.map(c => <button key={c} onClick={() => { fx('tap'); setF({ ...f, color: c }); }} style={{ width: 44, height: 44, borderRadius: 14, background: c, boxShadow: f.color === c ? '0 0 0 3px var(--bg), 0 0 0 5px ' + c : 'none' }} />)}
          </div>
        </Field>
      </Sheet>
    </Page>
  );
}
