// Pick a saved customer (or save a new one) for the current order.
import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, User, Phone, MapPin, X, ChevronRight, HandCoins, Percent, Check } from 'lucide-react';
import { useStore } from '../store.js';
import { toast } from '../ui.js';
import { rp, relDay } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { Sheet, Field, NumInput } from './ui.jsx';

const paidOf = s => (s.payments || []).reduce((a, p) => a + p.amount, 0);

export function pickCustomer(c) {
  const st = useStore.getState(); const cart = st.cart;
  if (!c) { st.setCart({ customer: '', customerId: null, phone: '', address: '' }); return; }
  st.setCart({ customer: c.name, customerId: c.id, phone: c.phone || '', address: c.address || '' });
  if (c.discPct && !cart.discVal) { st.setCart({ discType: 'pct', discVal: c.discPct }); toast(`${c.name} · diskon langganan ${c.discPct}% dipakai`); }
  else toast(`Pelanggan: ${c.name}`);
}

function useCustomerStats() {
  const sales = useStore(s => s.sales);
  return useMemo(() => {
    const m = new Map();
    for (const x of sales) {
      if (x.status === 'void' || !x.customerId) continue;
      const v = m.get(x.customerId) || { count: 0, last: 0, debt: 0 };
      v.count++; v.last = Math.max(v.last, x.date);
      if (x.status === 'debt') v.debt += x.total - paidOf(x);
      m.set(x.customerId, v);
    }
    return m;
  }, [sales]);
}

export function CustomerPicker({ open, onClose, onPick = pickCustomer }) {
  const customers = useStore(s => s.customers);
  const currentId = useStore(s => s.cart.customerId);
  const stats = useCustomerStats();
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  useEffect(() => { if (open) { setQ(''); setForm(null); } }, [open]);
  const t = q.trim().toLowerCase();
  const list = useMemo(() => customers
    .filter(c => !t || c.name.toLowerCase().includes(t) || (c.phone || '').replace(/\D/g, '').includes(t.replace(/\D/g, '') || '§') || (c.address || '').toLowerCase().includes(t))
    .map(c => ({ c, st: stats.get(c.id) || { count: 0, last: 0, debt: 0 } }))
    .sort((a, b) => (b.st.last || b.c.created || 0) - (a.st.last || a.c.created || 0)), [customers, stats, t]);
  const exact = customers.some(c => c.name.toLowerCase() === t);
  const pick = c => { fx('tap'); onPick(c); onClose(); };
  const saveNew = () => {
    const name = form.name.trim(); if (!name) return;
    const st = useStore.getState();
    st.saveCustomer({ name, phone: form.phone.trim(), address: form.address.trim(), discPct: Number(form.discPct) || 0, note: '' });
    const c = useStore.getState().customers.slice(-1)[0];
    fx('success'); pick(c);
  };

  return (
    <Sheet open={open} onClose={onClose} title={form ? 'Pelanggan baru' : 'Pilih pelanggan'} full
      footer={form ? <div className="row gap12"><button className="btn outline" onClick={() => setForm(null)}>Kembali</button><button className="btn primary grow lg" disabled={!form.name.trim()} onClick={saveNew}><Check size={20} /> Simpan & pilih</button></div>
        : <button className="btn soft block" onClick={() => setForm({ name: q.trim(), phone: '', address: '', discPct: '' })}><UserPlus size={20} /> Tambah pelanggan baru</button>}>
      {form ? <>
        <p className="small muted" style={{ marginTop: 0 }}>Data ini tersimpan. Lain kali tinggal pilih nama pelanggannya.</p>
        <Field label="Nama pelanggan"><div className="input-wrap"><span className="prefix"><User size={18} /></span><input className="input" autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Bu Siti" /></div></Field>
        <Field label="No. HP / WhatsApp (opsional)"><div className="input-wrap"><span className="prefix"><Phone size={18} /></span><input className="input" inputMode="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" /></div></Field>
        <Field label="Alamat (opsional)" hint="Tercetak di struk, berguna untuk antar-jemput"><div className="input-wrap"><span className="prefix"><MapPin size={18} /></span><input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Jl. Mawar No. 3" /></div></Field>
        <Field label="Diskon langganan % (opsional)" hint="Otomatis dipakai setiap kali pelanggan ini dipilih"><NumInput value={form.discPct} onChange={v => setForm({ ...form, discPct: v })} placeholder="0" /></Field>
      </> : <>
        <div className="search" style={{ marginBottom: 12 }}><Search size={20} /><input className="input" autoFocus={customers.length > 6} value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama, no. HP, alamat…" />
          {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 12, top: 13 }}><X size={20} color="var(--muted)" /></button>}</div>
        {currentId && <button className="btn ghost block sm" style={{ color: 'var(--expense)', marginBottom: 8 }} onClick={() => pick(null)}><X size={18} /> Hapus pelanggan dari pesanan ini</button>}
        {t && !exact && <button className="card row" style={{ width: '100%', textAlign: 'left', gap: 12, marginBottom: 12, background: 'var(--primary-soft)', boxShadow: 'none' }} onClick={() => setForm({ name: q.trim(), phone: '', address: '', discPct: '' })}>
          <UserPlus size={22} color="var(--primary)" /><div className="grow"><div className="bold">Simpan “{q.trim()}” sebagai pelanggan baru</div><div className="tiny muted">Isi no. HP & alamat (opsional)</div></div><ChevronRight size={18} className="chev" />
        </button>}
        {list.length === 0 && !t ? (
          <div className="empty"><h3>Belum ada pelanggan tersimpan</h3><p>Tekan “Tambah pelanggan baru” di bawah. Pelanggan juga tersimpan otomatis setelah transaksi pertama.</p></div>
        ) : (
          <div className="list">
            {list.map(({ c, st }) => (
              <button key={c.id} className="li" onClick={() => pick(c)} style={c.id === currentId ? { background: 'var(--primary-soft)' } : null}>
                <div className="ic" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>{c.name.slice(0, 1).toUpperCase()}</div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="t ellipsis">{c.name}{c.discPct ? <span className="tag blue" style={{ marginLeft: 6 }}><Percent size={11} />{c.discPct}</span> : null}</div>
                  <div className="s ellipsis">{[c.phone, c.address].filter(Boolean).join(' · ') || 'Tanpa no. HP'}</div>
                  <div className="tiny muted">{st.count ? `${st.count}× belanja · terakhir ${relDay(st.last).toLowerCase()}` : 'Belum pernah belanja'}</div>
                </div>
                {st.debt > 0 ? <span className="tag amber"><HandCoins size={12} /> {rp(st.debt)}</span> : c.id === currentId ? <span className="tag green">Dipilih</span> : <ChevronRight size={18} className="chev" />}
              </button>
            ))}
          </div>
        )}
      </>}
    </Sheet>
  );
}

// The customer row shown inside the order (cart)
export function CustomerField({ required }) {
  const cart = useStore(s => s.cart);
  const c = useStore(s => s.customers.find(x => x.id === s.cart.customerId));
  const stats = useCustomerStats();
  const [open, setOpen] = useState(false);
  const debt = c ? stats.get(c.id)?.debt || 0 : 0;
  return (
    <>
      <div className="field">
        <label>{required ? 'Pelanggan' : 'Pelanggan (opsional)'}</label>
        {cart.customer ? (
          <div className="card flat row" style={{ gap: 12, padding: 12, background: 'var(--surface)' }}>
            <div className="ic" style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'var(--primary)', color: 'var(--on-primary)', fontWeight: 800, fontSize: '1.15rem', flex: 'none' }}>{cart.customer.slice(0, 1).toUpperCase()}</div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="bold ellipsis">{cart.customer}</div>
              <div className="tiny muted ellipsis">{[cart.phone, cart.address].filter(Boolean).join(' · ') || (cart.customerId ? 'Pelanggan tersimpan' : 'Belum tersimpan — akan disimpan otomatis')}</div>
              {debt > 0 && <div className="tiny bold" style={{ color: '#C27C00' }}>⚠ Masih ada kasbon {rp(debt)}</div>}
            </div>
            <button className="btn sm soft" onClick={() => { fx('tap'); setOpen(true); }}>Ganti</button>
            <button className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => { fx('remove'); pickCustomer(null); }} aria-label="Hapus"><X size={18} /></button>
          </div>
        ) : (
          <button className="btn outline block" style={{ justifyContent: 'flex-start', paddingLeft: 14 }} onClick={() => { fx('tap'); setOpen(true); }}>
            <User size={20} /> <span className="grow" style={{ textAlign: 'left' }}>Pilih pelanggan</span> <span className="tiny muted">atau tambah baru</span> <ChevronRight size={18} />
          </button>
        )}
      </div>
      <CustomerPicker open={open} onClose={() => setOpen(false)} />
    </>
  );
}
