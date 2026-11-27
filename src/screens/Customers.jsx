import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Users, Trash2, MessageCircle, Phone, HandCoins, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store.js';
import { nav, toast, confirmDialog } from '../ui.js';
import { rp, fmtDate, fmtTime } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { Page, Header, Sheet, Field, Empty, useSelection, useLongPress, CheckCircle, SelectHeader, ActionBar, ActionBtn } from '../components/ui.jsx';
import { CheckSquare, ShoppingBag } from 'lucide-react';
import { pickCustomer } from '../components/CustomerPicker.jsx';
import { shareFile, toCsv } from '../lib/share.js';
import { FileDown } from 'lucide-react';
import { ArtPeople, ArtReceipt } from '../components/art.jsx';
import { SaleRow, paidOf, PayDebtSheet } from './Sales.jsx';

const waNum = p => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '62' + d.slice(1); return d; };
export function openWa(phone, text) {
  const url = `https://wa.me/${waNum(phone)}?text=${encodeURIComponent(text)}`;
  window.location.href = url;
}

function stats(sales, c) {
  const mine = sales.filter(s => s.status !== 'void' && (s.customerId === c.id || (!s.customerId && s.customer && s.customer.toLowerCase() === c.name.toLowerCase())));
  const spent = mine.reduce((a, s) => a + s.total, 0);
  const debt = mine.filter(s => s.status === 'debt').reduce((a, s) => a + s.total - paidOf(s), 0);
  return { mine, spent, debt, count: mine.length };
}

export function CustomerSheet({ customer, onClose }) {
  const [f, setF] = useState(null);
  useEffect(() => { if (customer) setF({ name: '', phone: '', address: '', discPct: 0, note: '', ...customer }); }, [customer]);
  const save = () => { if (!f.name.trim()) return; useStore.getState().saveCustomer({ ...f, name: f.name.trim(), discPct: Math.min(100, Number(String(f.discPct).replace(',', '.')) || 0) }); fx('success'); toast('Pelanggan disimpan'); onClose(); };
  return (
    <Sheet open={!!customer} onClose={onClose} title={customer?.id ? 'Ubah pelanggan' : 'Pelanggan baru'} footer={<button className="btn primary block lg" disabled={!f?.name?.trim()} onClick={save}>Simpan</button>}>
      {f && <>
        <Field label="Nama"><input className="input" autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Contoh: Bu Siti" /></Field>
        <Field label="No. HP / WhatsApp"><input className="input" inputMode="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="08xxxxxxxxxx" /></Field>
        <Field label="Alamat" hint="Tercetak di struk & label"><input className="input" value={f.address || ''} onChange={e => setF({ ...f, address: e.target.value })} placeholder="Jl. Mawar No. 3, RT 02" /></Field>
        <Field label="Diskon langganan (%)" hint="Otomatis dipakai saat pelanggan ini dipilih di kasir"><input className="input num" inputMode="decimal" value={f.discPct || ''} onChange={e => setF({ ...f, discPct: e.target.value.replace(/[^\d.,]/g, '') })} placeholder="0" /></Field>
        <Field label="Catatan"><textarea className="input" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder="Contoh: langganan katering kantor" /></Field>
      </>}
    </Sheet>
  );
}

function CustRow({ c, spent, debt, count, sel }) {
  const lp = useLongPress(() => { if (!sel.on) sel.start(c.id); });
  const picked = sel.has(c.id);
  return (
    <button className="li" {...lp} style={picked ? { background: 'var(--primary-soft)' } : null}
      onClick={() => { if (lp.wasLong()) return; if (sel.on) sel.toggle(c.id); else { fx('tap'); nav.push('customer', { id: c.id }); } }}>
      {sel.on && <CheckCircle on={picked} />}
      <div className="ic" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800 }}>{c.name.slice(0, 1).toUpperCase()}</div>
      <div className="grow" style={{ minWidth: 0 }}><div className="t ellipsis">{c.name}</div><div className="s">{count} transaksi · belanja {rp(spent)}{c.phone ? ` · ${c.phone}` : ''}</div></div>
      {debt > 0 && <span className="tag amber">Kasbon {rp(debt)}</span>}
      {!sel.on && <ChevronRight size={20} className="chev" />}
    </button>
  );
}

export function Customers() {
  const customers = useStore(s => s.customers); const sales = useStore(s => s.sales);
  const [q, setQ] = useState(''); const [edit, setEdit] = useState(null);
  const sel = useSelection();
  const list = useMemo(() => customers.filter(c => !q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()) || (c.phone || '').includes(q.trim())).map(c => ({ c, ...stats(sales, c) })).sort((a, b) => b.spent - a.spent), [customers, sales, q]);
  const ids = sel.ids();
  const delSel = async () => {
    if (!(await confirmDialog({ title: `Hapus ${ids.length} pelanggan?`, message: 'Riwayat transaksi mereka tetap tersimpan.', ok: `Hapus ${ids.length}`, danger: true }))) return;
    const removed = useStore.getState().deleteCustomers(ids); fx('remove'); sel.clear();
    toast(`${removed.length} pelanggan dihapus`, { action: { label: 'URUNGKAN', fn: () => useStore.getState().restoreCustomers(removed) } });
  };
  const exportSel = async () => {
    const rows = [['Nama', 'No HP', 'Transaksi', 'Total belanja', 'Kasbon', 'Catatan'], ...list.filter(x => sel.has(x.c.id)).map(x => [x.c.name, x.c.phone, x.count, x.spent, x.debt, x.c.note])];
    try { await shareFile('pelanggan.csv', toCsv(rows), { mime: 'text/csv', title: 'Ekspor pelanggan' }); fx('success'); } catch { /* cancelled */ }
  };
  return (
    <div className="page">
      {sel.on ? <SelectHeader selection={sel} allIds={list.map(x => x.c.id)} label="pelanggan dipilih" />
        : <Header title="Pelanggan" sub={`${customers.length} pelanggan`} right={<>
          {customers.length > 0 && <button className="icon-btn solid" onClick={() => sel.start()} aria-label="Pilih banyak"><CheckSquare size={21} /></button>}
          <button className="icon-btn solid" onClick={() => setEdit({})}><Plus size={22} /></button>
        </>} />}
      <div className="scroll" style={{ paddingBottom: 'calc(var(--safe-bottom) + 110px)' }}><div className="pad">
        {customers.length === 0 ? <Empty art={ArtPeople} title="Belum ada pelanggan" text="Pelanggan tersimpan otomatis saat Anda mengisi nama pembeli di kasir. Bisa juga ditambah manual." action={<button className="btn primary" onClick={() => setEdit({})}><Plus size={20} /> Tambah Pelanggan</button>} /> : <>
          <div className="search" style={{ marginBottom: 12 }}><Search size={20} /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama atau no. HP…" /></div>
          <div className="list">{list.map(x => <CustRow key={x.c.id} {...x} sel={sel} />)}</div>
        </>}
      </div></div>
      <ActionBar show={sel.on}>
        <ActionBtn icon={Trash2} label="Hapus" danger disabled={!ids.length} onClick={delSel} />
        <ActionBtn icon={FileDown} label="Ekspor" disabled={!ids.length} onClick={exportSel} />
      </ActionBar>
      <CustomerSheet customer={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

export function CustomerDetail({ id }) {
  const c = useStore(s => s.customers.find(x => x.id === id)); const sales = useStore(s => s.sales); const store = useStore(s => s.settings.storeName);
  const [edit, setEdit] = useState(null);
  if (!c) return <Page title="Pelanggan"><Empty title="Pelanggan tidak ditemukan" /></Page>;
  const st = stats(sales, c);
  const del = async () => { if (await confirmDialog({ title: `Hapus ${c.name}?`, message: 'Riwayat transaksi tetap tersimpan.', ok: 'Hapus', danger: true })) { useStore.getState().deleteCustomer(c.id); fx('remove'); nav.pop(); } };
  const remind = () => openWa(c.phone, `Halo ${c.name}, kami dari ${store}. Sekadar mengingatkan, kasbon Anda saat ini ${rp(st.debt)}. Terima kasih 🙏`);
  return (
    <Page title={c.name} sub={c.phone || 'Tanpa nomor HP'} right={<button className="icon-btn" onClick={del}><Trash2 size={21} color="var(--expense)" /></button>}>
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div><div className="tiny bold muted">Transaksi</div><div className="bold" style={{ fontSize: '1.2rem' }}>{st.count}</div></div>
          <div><div className="tiny bold muted">Total belanja</div><div className="bold num" style={{ fontSize: '1.05rem' }}>{rp(st.spent)}</div></div>
          <div><div className="tiny bold muted">Kasbon</div><div className="bold num" style={{ fontSize: '1.05rem', color: st.debt ? '#C27C00' : 'var(--income)' }}>{st.debt ? rp(st.debt) : 'Lunas'}</div></div>
        </div>
        {c.address && <div className="small mt12">📍 {c.address}</div>}
        {c.discPct ? <div className="small bold prim mt8">Diskon langganan {c.discPct}%</div> : null}
        {c.note && <div className="small muted mt12">{c.note}</div>}
      </div>
      <button className="btn primary block mt12" onClick={() => { const st = useStore.getState(); if (st.cart.items.length && st.cart.customerId !== c.id) st.holdCart(); pickCustomer(c); nav.root(); nav.tab('cashier'); }}><ShoppingBag size={20} /> Transaksi baru untuk {c.name}</button>
      <div className="row gap8 mt12">
        <button className="btn soft grow" onClick={() => setEdit(c)}>Ubah data</button>
        {c.phone && <button className="btn outline grow" onClick={() => { window.location.href = 'tel:' + c.phone; }}><Phone size={18} /> Telepon</button>}
        {c.phone && st.debt > 0 && <button className="btn grow" style={{ background: '#25D366', color: '#fff' }} onClick={remind}><MessageCircle size={18} /> Ingatkan</button>}
      </div>
      <div className="section-title">Riwayat belanja</div>
      {st.mine.length ? <div className="list">{st.mine.map(s => <SaleRow key={s.id} sale={s} time={`${fmtDate(s.date)} ${fmtTime(s.date)}`} />)}</div> : <div className="card muted" style={{ textAlign: 'center' }}>Belum ada transaksi</div>}
      <CustomerSheet customer={edit} onClose={() => setEdit(null)} />
    </Page>
  );
}

export function Debts() {
  const sales = useStore(s => s.sales); const customers = useStore(s => s.customers); const store = useStore(s => s.settings.storeName);
  const [pay, setPay] = useState(null);
  const open = sales.filter(s => s.status === 'debt');
  const groups = useMemo(() => {
    const m = new Map();
    open.forEach(s => { const k = s.customerId || s.customer || '?'; if (!m.has(k)) m.set(k, { name: s.customer || 'Tanpa nama', id: s.customerId, list: [] }); m.get(k).list.push(s); });
    return [...m.values()].map(g => ({ ...g, total: g.list.reduce((a, s) => a + s.total - paidOf(s), 0) })).sort((a, b) => b.total - a.total);
  }, [sales]);
  const total = groups.reduce((a, g) => a + g.total, 0);
  return (
    <Page title="Kasbon Pelanggan" sub={open.length ? `${open.length} transaksi belum lunas` : 'Semua lunas'}>
      <div className="card" style={{ background: 'linear-gradient(150deg, #F6B957, #E39522)', color: '#3A2600' }}>
        <div className="small bold" style={{ opacity: 0.8 }}>Total kasbon belum dibayar</div>
        <div className="num" style={{ fontSize: '2rem', fontWeight: 800 }}>{rp(total)}</div>
        <div className="small bold" style={{ opacity: 0.8 }}>{groups.length} pelanggan</div>
      </div>
      {groups.length === 0 ? <Empty art={ArtReceipt} title="Tidak ada kasbon" text="Pilih “Kasbon” saat pembayaran untuk mencatat pembeli yang bayar belakangan." /> : groups.map(g => {
        const phone = customers.find(c => c.id === g.id)?.phone;
        return (
          <div key={g.name + g.id}>
            <div className="section-title"><span style={{ textTransform: 'none', letterSpacing: 0, fontSize: '1rem', color: 'var(--text)' }}>{g.name}</span><span className="num" style={{ color: '#C27C00', textTransform: 'none' }}>{rp(g.total)}</span></div>
            <div className="list">
              {g.list.map(s => (
                <div key={s.id} className="li">
                  <button className="row grow" style={{ gap: 12, textAlign: 'left', minWidth: 0 }} onClick={() => nav.push('sale', { id: s.id })}>
                    <div className="ic" style={{ background: 'var(--accent-soft)', color: '#C27C00' }}><HandCoins size={20} /></div>
                    <div className="grow" style={{ minWidth: 0 }}><div className="t num">{rp(s.total - paidOf(s))}</div><div className="s ellipsis">{fmtDate(s.date)} · {s.no}</div></div>
                  </button>
                  <button className="btn sm primary" onClick={() => setPay(s)}><CheckCircle2 size={16} /> Bayar</button>
                </div>
              ))}
            </div>
            {phone && <button className="btn sm ghost mt8" style={{ color: '#1DA851' }} onClick={() => openWa(phone, `Halo ${g.name}, kami dari ${store}. Sekadar mengingatkan, kasbon Anda saat ini ${rp(g.total)}. Terima kasih 🙏`)}><MessageCircle size={17} /> Ingatkan lewat WhatsApp</button>}
          </div>
        );
      })}
      <PayDebtSheet sale={pay} onClose={() => setPay(null)} />
    </Page>
  );
}
