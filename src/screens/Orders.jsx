import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, PackageCheck, MessageCircle, CalendarClock, HandCoins, ShoppingBag } from 'lucide-react';
import { useStore, WORK, fmtQty } from '../store.js';
import { nav, toast, confirmDialog } from '../ui.js';
import { rp, fmtDateTime, startOfDay } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { Page, Seg, Empty } from '../components/ui.jsx';
import { ArtReceipt } from '../components/art.jsx';
import { paidOf, PayDebtSheet } from './Sales.jsx';
import { openWa } from './Customers.jsx';
import { dueLabel } from './Cashier.jsx';

export const workOf = id => WORK.find(w => w.id === id) || WORK[0];

export function readyMessage(sale, s) {
  const what = s.bizType === 'laundry' ? 'cucian' : 'pesanan';
  const left = sale.total - (sale.status === 'debt' ? paidOf(sale) : sale.total);
  return `Halo ${sale.customer || 'Kak'}, ${what} Anda di ${s.storeName} (${sale.no}) sudah selesai dan siap diambil. ` +
    (sale.status === 'debt' ? `Sisa pembayaran ${rp(left)}.` : `Total ${rp(sale.total)} sudah lunas.`) + ' Terima kasih 🙏';
}

export function useWorkActions() {
  const s = useStore(st => st.settings); const customers = useStore(st => st.customers);
  const [pay, setPay] = useState(null);
  const phoneOf = sale => sale.phone || customers.find(c => c.id === sale.customerId)?.phone || '';
  const markReady = async sale => {
    useStore.getState().setWork(sale.id, 'ready'); fx('success');
    const ph = phoneOf(sale);
    if (ph && await confirmDialog({ title: 'Kabari pelanggan?', message: `Kirim pesan WhatsApp ke ${sale.customer} bahwa ${s.bizType === 'laundry' ? 'cucian' : 'pesanan'} sudah siap diambil.`, ok: 'Kirim WhatsApp', cancel: 'Nanti saja', icon: MessageCircle })) openWa(ph, readyMessage(sale, s));
    else toast(`${sale.customer || sale.no} siap diambil`);
  };
  const markDone = async sale => {
    if (sale.status === 'debt') {
      if (await confirmDialog({ title: 'Belum lunas', message: `Sisa ${rp(sale.total - paidOf(sale))}. Terima pembayaran sekarang sebelum diserahkan?`, ok: 'Terima pembayaran', cancel: 'Batal', icon: HandCoins })) setPay(sale);
      return;
    }
    useStore.getState().setWork(sale.id, 'done'); fx('cash'); toast('Pesanan sudah diambil ✅');
  };
  const notify = sale => { const ph = phoneOf(sale); if (!ph) { toast('Nomor HP pelanggan belum diisi', { type: 'error' }); return; } openWa(ph, readyMessage(sale, s)); };
  const paySheet = <PayDebtSheet sale={pay} onClose={() => {
    const x = pay && useStore.getState().sales.find(y => y.id === pay.id);
    if (x && x.status === 'paid') { useStore.getState().setWork(x.id, 'done'); toast('Lunas & sudah diambil ✅'); }
    setPay(null);
  }} />;
  return { markReady, markDone, notify, phoneOf, paySheet };
}

function OrderCard({ sale, actions }) {
  const s = useStore(st => st.settings);
  const late = sale.work !== 'done' && sale.due && sale.due < Date.now();
  const today = sale.due && startOfDay(sale.due) === startOfDay();
  const unpaid = sale.status === 'debt';
  return (
    <motion.div layout className="card" style={{ padding: 14 }}>
      <button className="row" style={{ width: '100%', textAlign: 'left', alignItems: 'flex-start', gap: 12 }} onClick={() => { fx('tap'); nav.push('sale', { id: sale.id }); }}>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="bold ellipsis" style={{ fontSize: '1.05rem' }}>{sale.customer || 'Tanpa nama'}</div>
          <div className="tiny muted">{sale.no} · masuk {fmtDateTime(sale.date)}</div>
        </div>
        <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
          <div className="bold num">{rp(sale.total)}</div>
          {unpaid ? <span className="tag amber">Belum bayar {rp(sale.total - paidOf(sale))}</span> : <span className="tag green">Lunas</span>}
        </div>
      </button>
      <div className="small mt8" style={{ lineHeight: 1.4 }}>{sale.items.map(i => `${fmtQty(i.qty, i.unit)} ${i.name}`).join(' · ')}</div>
      {sale.note && <div className="tiny muted mt8">📝 {sale.note}</div>}
      {sale.work !== 'done' && sale.due ? (
        <div className="row small bold mt8" style={{ gap: 6, color: late ? 'var(--expense)' : today ? '#C27C00' : 'var(--info)' }}><CalendarClock size={16} />{late ? 'Terlambat · ' : ''}Selesai {dueLabel(sale.due)}</div>
      ) : sale.work === 'done' ? <div className="tiny muted mt8">Diambil {sale.doneAt ? fmtDateTime(sale.doneAt) : ''}</div> : null}
      {sale.work !== 'done' && (
        <div className="row gap8 mt12">
          {sale.work === 'process' && <button className="btn primary sm grow" onClick={() => actions.markReady(sale)}><CheckCircle2 size={18} /> Tandai selesai</button>}
          {sale.work === 'ready' && <>
            <button className="btn sm" style={{ background: '#25D366', color: '#fff' }} onClick={() => actions.notify(sale)}><MessageCircle size={18} /> WA</button>
            <button className={'btn sm grow ' + (unpaid ? 'accent' : 'primary')} onClick={() => actions.markDone(sale)}><PackageCheck size={18} /> {unpaid ? 'Terima bayar & serahkan' : 'Sudah diambil'}</button>
          </>}
        </div>
      )}
    </motion.div>
  );
}

export default function Orders() {
  const sales = useStore(st => st.sales); const s = useStore(st => st.settings);
  const [tab, setTab] = useState('process'); const [q, setQ] = useState('');
  const actions = useWorkActions();
  const all = useMemo(() => sales.filter(x => x.work && x.status !== 'void'), [sales]);
  const counts = { process: all.filter(x => x.work === 'process').length, ready: all.filter(x => x.work === 'ready').length };
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const l = all.filter(x => x.work === tab && (!t || (x.customer || '').toLowerCase().includes(t) || x.no.toLowerCase().includes(t)));
    return tab === 'done' ? l.sort((a, b) => (b.doneAt || b.date) - (a.doneAt || a.date)).slice(0, 100) : l.sort((a, b) => (a.due || a.date) - (b.due || b.date));
  }, [all, tab, q]);
  const laundry = s.bizType === 'laundry';
  return (
    <Page title={laundry ? 'Cucian' : 'Pesanan Berjalan'} sub={`${counts.process} diproses · ${counts.ready} siap diambil`}>
      <Seg value={tab} onChange={setTab} options={[{ value: 'process', label: `Diproses${counts.process ? ` (${counts.process})` : ''}` }, { value: 'ready', label: `Siap${counts.ready ? ` (${counts.ready})` : ''}` }, { value: 'done', label: 'Diambil' }]} />
      <div className="search mt12"><Search size={20} /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama pelanggan atau no. nota…" /></div>
      <div className="col gap12 mt12" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {list.map(x => <OrderCard key={x.id} sale={x} actions={actions} />)}
      </div>
      {list.length === 0 && <Empty art={ArtReceipt} title={tab === 'process' ? 'Tidak ada yang sedang diproses' : tab === 'ready' ? 'Belum ada yang siap diambil' : 'Belum ada riwayat'}
        text={tab === 'process' ? `${laundry ? 'Cucian' : 'Pesanan'} baru dari kasir dengan estimasi selesai akan muncul di sini.` : null}
        action={tab === 'process' && <button className="btn primary" onClick={() => { nav.root(); nav.tab('cashier'); }}><ShoppingBag size={20} /> Terima {laundry ? 'cucian' : 'pesanan'} baru</button>} />}
      {actions.paySheet}
    </Page>
  );
}
