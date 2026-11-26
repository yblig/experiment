import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2, Star, PackagePlus, Sparkles, Minus, Tags, X } from 'lucide-react';
import { useStore, COLORS, UNITS, fmtQty, bizOf } from '../store.js';
import { nav, toast, confirmDialog } from '../ui.js';
import { rp } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { Page, Sheet, Field, MoneyInput, Toggle, Empty, NumInput } from '../components/ui.jsx';
import { ArtBox } from '../components/art.jsx';

const EMOJIS = ['🍛', '🍚', '🍜', '🍝', '🍗', '🍖', '🥩', '🍳', '🥚', '🍲', '🥣', '🍢', '🍡', '🥟', '🍔', '🌭', '🍕', '🥪', '🌮', '🍞', '🥐', '🍰', '🧁', '🍩', '🍪', '🍫', '🍬', '🍦', '🍧', '🍌', '🍊', '🍉', '🥭', '🥑', '🥔', '🌽', '🥬', '🌶️', '🧅', '🍘', '🥜', '☕', '🍵', '🧋', '🥤', '🧃', '🥛', '💧', '🍺', '🧊', '🥡', '📦', '🧴', '🧼', '🧻', '🪥', '💊', '🔋', '💡', '✂️', '👕', '👗', '👟', '💄', '📱', '🎁', '⛽', '🧺'];

export function ProductSheet({ product, onClose }) {
  const categories = useStore(s => s.categories);
  const [f, setF] = useState(null);
  const [emo, setEmo] = useState(false);
  const [newCat, setNewCat] = useState('');
  useEffect(() => { if (product) { setNewCat(''); setF({ name: '', price: 0, cost: 0, catId: categories[0]?.id || null, emoji: '', stock: null, fav: false, unit: useStore.getState().settings.bizType === 'laundry' ? 'kg' : 'pcs', ...product }); setEmo(false); } }, [product]);
  const isEdit = !!product?.id;
  const save = () => {
    if (!f.name.trim()) { fx('error'); toast('Nama produk belum diisi', { type: 'error' }); return; }
    useStore.getState().saveProduct({ ...f, name: f.name.trim() });
    fx('success'); toast(isEdit ? 'Produk disimpan' : `${f.name.trim()} ditambahkan`); onClose();
  };
  const del = async () => {
    if (!(await confirmDialog({ title: `Hapus ${f.name}?`, message: 'Riwayat penjualan produk ini tetap tersimpan.', ok: 'Hapus', danger: true }))) return;
    const old = useStore.getState().products.find(p => p.id === f.id);
    useStore.getState().deleteProduct(f.id); fx('remove'); onClose();
    toast('Produk dihapus', { action: { label: 'URUNGKAN', fn: () => useStore.getState().restoreProduct(old) } });
  };
  const profit = f ? f.price - (f.cost || 0) : 0;
  return (
    <Sheet open={!!product} onClose={onClose} title={isEdit ? 'Ubah produk' : 'Produk baru'} full
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
        <Field label="Dihitung per (satuan)" hint={f.unit === 'kg' || f.unit === 'liter' || f.unit === 'meter' || f.unit === 'jam' ? 'Saat di kasir, Anda bisa mengetik berat/jumlah desimal, misal 3,5' : null}>
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
        <div className="card flat">
          <div className="row"><div className="grow"><div className="bold">Hitung stok</div><div className="tiny muted">Stok berkurang otomatis saat terjual</div></div><Toggle on={f.stock != null} onChange={on => setF({ ...f, stock: on ? 0 : null })} /></div>
          {f.stock != null && <div className="row gap8 mt12">
            <button className="icon-btn solid" onClick={() => setF({ ...f, stock: Math.max(0, f.stock - 1) })}><Minus size={20} /></button>
            <NumInput value={f.stock} onChange={v => setF({ ...f, stock: Math.max(0, Number(String(v).replace(',', '.')) || 0) })} style={{ textAlign: 'center' }} />
            <button className="icon-btn solid" onClick={() => setF({ ...f, stock: f.stock + 1 })}><Plus size={20} /></button>
          </div>}
          {f.stock != null && <div className="row gap8 mt8">{[5, 10, 24, 50].map(n => <button key={n} className="btn sm outline grow" onClick={() => setF({ ...f, stock: f.stock + n })}>+{n}</button>)}</div>}
          <div className="divider" />
          <div className="row"><div className="grow"><div className="bold">Produk favorit</div><div className="tiny muted">Tampil paling depan di kasir</div></div><Toggle on={f.fav} onChange={v => setF({ ...f, fav: v })} /></div>
        </div>
      </>}
    </Sheet>
  );
}

export function Products({ filter: initFilter = 'all' }) {
  const products = useStore(s => s.products); const categories = useStore(s => s.categories); const low = useStore(s => s.settings.lowStock);
  const [q, setQ] = useState(''); const [filter, setFilter] = useState(initFilter);
  const [edit, setEdit] = useState(null);
  const list = useMemo(() => {
    let l = products;
    if (filter === 'low') l = l.filter(p => p.stock != null && p.stock <= low);
    else if (filter === 'fav') l = l.filter(p => p.fav);
    else if (filter !== 'all') l = l.filter(p => p.catId === filter);
    if (q.trim()) l = l.filter(p => p.name.toLowerCase().includes(q.trim().toLowerCase()));
    return [...l].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, filter, q, low]);
  const lowCount = products.filter(p => p.stock != null && p.stock <= low).length;
  return (
    <Page title="Produk & Stok" sub={`${products.length} produk`} noPad
      right={<button className="icon-btn solid" onClick={() => setEdit({})} aria-label="Tambah"><Plus size={22} /></button>}>
      {products.length === 0 ? (
        <Empty art={ArtBox} title="Belum ada produk" text="Tambahkan barang dagangan Anda agar transaksi di kasir lebih cepat."
          action={<div className="col gap8" style={{ maxWidth: 300, margin: '0 auto' }}>
            <button className="btn primary" onClick={() => setEdit({})}><PackagePlus size={20} /> Tambah Produk</button>
            <button className="btn soft" onClick={() => { useStore.getState().loadSample(); fx('success'); }}><Sparkles size={20} /> Pakai contoh {bizOf(useStore.getState().settings.bizType).name.toLowerCase()}</button>
          </div>} />
      ) : <>
        <div className="pad" style={{ paddingBottom: 10 }}><div className="search"><Search size={20} /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari produk…" /></div></div>
        <div className="chips" style={{ paddingBottom: 12 }}>
          <button className={'chip' + (filter === 'all' ? ' on' : '')} onClick={() => setFilter('all')}>Semua</button>
          <button className={'chip' + (filter === 'low' ? ' on' : '')} onClick={() => setFilter('low')}>Stok menipis {lowCount > 0 && <span className="badge" style={{ background: 'var(--expense)', color: '#fff', height: 20 }}>{lowCount}</span>}</button>
          <button className={'chip' + (filter === 'fav' ? ' on' : '')} onClick={() => setFilter('fav')}><Star size={14} /> Favorit</button>
          {categories.map(c => <button key={c.id} className={'chip' + (filter === c.id ? ' on' : '')} onClick={() => setFilter(c.id)}><span style={{ width: 9, height: 9, borderRadius: 5, background: c.color }} />{c.name}</button>)}
        </div>
        <div className="pad">
          <div className="list">
            {list.map(p => {
              const cat = categories.find(c => c.id === p.catId);
              const isLow = p.stock != null && p.stock <= low;
              return (
                <div key={p.id} className="li">
                  <button className="row grow" style={{ gap: 14, minWidth: 0, textAlign: 'left' }} onClick={() => { fx('tap'); setEdit(p); }}>
                    <div className="ic" style={{ background: `color-mix(in srgb, ${cat?.color || '#0E7C66'} 15%, var(--surface))`, fontSize: 22 }}>{p.emoji || <b style={{ color: cat?.color }}>{p.name.slice(0, 2).toUpperCase()}</b>}</div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="t ellipsis">{p.fav ? '⭐ ' : ''}{p.name}</div>
                      <div className="s num">{rp(p.price)}{p.unit && p.unit !== 'pcs' ? '/' + p.unit : ''}{p.cost ? <span className="green"> · untung {rp(p.price - p.cost)}</span> : ''} · terjual {fmtQty(p.sold || 0, p.unit)}</div>
                    </div>
                  </button>
                  {p.stock != null ? (
                    <div className="row" style={{ gap: 4 }}>
                      <button className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => { fx('tap'); useStore.getState().adjustStock(p.id, -1); }}><Minus size={18} /></button>
                      <span className={'tag ' + (p.stock <= 0 ? 'red' : isLow ? 'amber' : 'gray')} style={{ minWidth: 44, justifyContent: 'center', fontSize: '.85rem' }}>{fmtQty(p.stock)}</span>
                      <button className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => { fx('add'); useStore.getState().adjustStock(p.id, 1); }}><Plus size={18} /></button>
                    </div>
                  ) : <span className="tiny muted">∞</span>}
                </div>
              );
            })}
          </div>
          {list.length === 0 && <div className="empty"><p>Tidak ada produk di sini.</p></div>}
          <button className="btn primary block mt16" onClick={() => setEdit({})}><PackagePlus size={20} /> Tambah Produk</button>
        </div>
      </>}
      <ProductSheet product={edit} onClose={() => setEdit(null)} />
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
