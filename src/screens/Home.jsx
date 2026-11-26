import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Printer, ShoppingBag, ArrowDownCircle, ArrowUpCircle, Package, BarChart3, Lock, ChevronRight, AlertTriangle, PauseCircle, HandCoins, Bluetooth, Eye } from 'lucide-react';
import { useStore } from '../store.js';
import { useUI, nav } from '../ui.js';
import { usePrinter } from '../lib/printer.js';
import { computeReport, dailySeries } from '../lib/report.js';
import { rp, greeting, fmtDateLong, fmtTime, startOfDay } from '../lib/format.js';
import { BarChart } from '../components/charts.jsx';
import { fx } from '../lib/fx.js';
import { SaleRow } from './Sales.jsx';

export function PrinterPill() {
  const p = usePrinter(); const name = useStore(s => s.settings.printerName);
  const on = p.state === 'connected';
  const color = on ? 'var(--income)' : p.state === 'connecting' ? 'var(--accent)' : 'var(--muted)';
  return (
    <button onClick={() => nav.push('printer')} className="row" style={{ gap: 7, height: 40, padding: '0 12px', borderRadius: 20, background: 'var(--surface)', boxShadow: 'var(--shadow)', fontSize: '.8rem', fontWeight: 800, color }}>
      {on ? <Printer size={17} /> : <Bluetooth size={17} className={p.state === 'connecting' ? 'pulse' : ''} />}
      <span className="ellipsis" style={{ maxWidth: 92 }}>{on ? (p.name || name || 'Printer') : p.state === 'connecting' ? 'Menyambung…' : 'Printer'}</span>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
    </button>
  );
}

export default function Home() {
  const st = useStore();
  const s = st.settings;
  const unlocked = useUI(u => u.unlocked);
  const hidden = !!s.pin && s.lock.finance && !unlocked;
  const today = useMemo(() => computeReport(st, startOfDay(), startOfDay() + 864e5, 'Hari ini'), [st.sales, st.finance]);
  const series = useMemo(() => dailySeries(st, 7), [st.sales, st.finance]);
  const low = st.products.filter(p => p.stock != null && p.stock <= s.lowStock);
  const debts = st.sales.filter(x => x.status === 'debt');
  const work = st.sales.filter(x => x.work && x.work !== 'done' && x.status !== 'void');
  const workReady = work.filter(x => x.work === 'ready').length;
  const workLate = work.filter(x => x.work === 'process' && x.due && x.due < Date.now()).length;
  const debtTotal = debts.reduce((a, x) => a + x.total - (x.payments || []).reduce((b, p) => b + p.amount, 0), 0);
  const recent = st.sales.slice(0, 5);

  const openFinance = async type => {
    const ok = await useUI.getState().requirePin('finance', 'Buka Keuangan'); if (!ok) return;
    useUI.setState({ financeIntent: type });
    useUI.getState().setTab('finance');
  };
  const reveal = async () => { await useUI.getState().requirePin('finance', 'Lihat Keuangan'); };

  const Quick = ({ icon: Icon, label, color, bg, onClick }) => (
    <motion.button whileTap={{ scale: 0.94 }} onClick={() => { fx('tap'); onClick(); }} className="col" style={{ alignItems: 'center', gap: 8, padding: '14px 4px', borderRadius: 20, background: 'var(--surface)', boxShadow: 'var(--shadow)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', background: bg, color }}><Icon size={24} /></div>
      <span className="small bold" style={{ lineHeight: 1.15, textAlign: 'center' }}>{label}</span>
    </motion.button>
  );

  return (
    <div className="page">
      <div className="header home">
        <div className="grow">
          <div className="sub">{greeting()} 👋</div>
          <h1 style={{ fontSize: '1.35rem' }}>{s.storeName || 'Toko Saya'}</h1>
        </div>
        <PrinterPill />
      </div>
      <div className="scroll with-tabbar">
        <div className="pad">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ background: 'linear-gradient(150deg, var(--primary-2), var(--primary-dark))', color: '#fff', padding: 20, position: 'relative', overflow: 'hidden' }}>
            <svg width="190" height="190" viewBox="0 0 200 200" style={{ position: 'absolute', right: -50, top: -50, opacity: 0.12 }}><circle cx="100" cy="100" r="90" fill="none" stroke="#fff" strokeWidth="26" /><circle cx="100" cy="100" r="40" fill="#fff" /></svg>
            <div className="small" style={{ opacity: 0.85, fontWeight: 700 }}>Penjualan hari ini · {fmtDateLong(Date.now()).split(',')[0]}</div>
            <div className="num" style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-.02em', margin: '4px 0 2px' }}>{rp(today.omzet)}</div>
            <div className="small" style={{ opacity: 0.9, fontWeight: 600 }}>{today.count} transaksi · {today.qty} {s.bizType === 'laundry' || s.bizType === 'service' ? 'item' : 'barang terjual'}</div>
            <button className="btn block mt16" onClick={() => nav.tab('cashier')} style={{ background: '#fff', color: 'var(--primary-dark)', boxShadow: '0 6px 16px rgba(0,0,0,.15)' }}>
              <ShoppingBag size={21} /> Mulai Transaksi
            </button>
          </motion.div>

          <div className="row mt12" style={{ gap: 12 }}>
            <div className="card grow" style={{ padding: 14 }} onClick={hidden ? reveal : undefined}>
              <div className="tiny bold muted">Pengeluaran hari ini</div>
              <div className="bold num red mt8" style={{ fontSize: '1.15rem' }}>{hidden ? <span className="row muted" style={{ gap: 6 }}><Lock size={15} />••••••</span> : rp(today.out)}</div>
            </div>
            <div className="card grow" style={{ padding: 14 }} onClick={hidden ? reveal : undefined}>
              <div className="tiny bold muted">Laba bersih hari ini</div>
              <div className="bold num mt8" style={{ fontSize: '1.15rem', color: today.net >= 0 ? 'var(--income)' : 'var(--expense)' }}>{hidden ? <span className="row muted" style={{ gap: 6 }}><Eye size={15} />Lihat</span> : rp(today.net)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
            <Quick icon={ArrowDownCircle} label="Catat Pemasukan" color="var(--income)" bg="var(--income-soft)" onClick={() => openFinance('in')} />
            <Quick icon={ArrowUpCircle} label="Catat Pengeluaran" color="var(--expense)" bg="var(--expense-soft)" onClick={() => openFinance('out')} />
            <Quick icon={Package} label="Produk & Stok" color="var(--info)" bg="var(--info-soft)" onClick={() => nav.push('products')} />
            <Quick icon={BarChart3} label="Laporan" color="#A86A00" bg="var(--accent-soft)" onClick={async () => { if (await useUI.getState().requirePin('reports', 'Buka Laporan')) nav.push('reports'); }} />
          </div>

          {s.trackOrders && (
            <button className="card row mt16" style={{ width: '100%', padding: 16, textAlign: 'left', gap: 14 }} onClick={() => nav.push('orders')}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: 'var(--info-soft)', display: 'grid', placeItems: 'center', fontSize: 26, flex: 'none' }}>{s.bizType === 'laundry' ? '🧺' : '📋'}</div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="bold" style={{ fontSize: '1.05rem' }}>{s.bizType === 'laundry' ? 'Cucian' : 'Pesanan berjalan'}</div>
                <div className="small muted">{work.length - workReady} diproses · <b className="green">{workReady} siap diambil</b>{workLate ? <b className="red"> · {workLate} terlambat</b> : ''}</div>
              </div>
              <ChevronRight size={20} className="chev" />
            </button>
          )}
          {(st.held.length > 0 || low.length > 0 || debts.length > 0) && (
            <div className="col gap8 mt16">
              {st.held.length > 0 && (
                <button className="card row" style={{ padding: 14, background: 'var(--info-soft)', boxShadow: 'none' }} onClick={() => { useUI.setState({ cashierIntent: 'held' }); nav.tab('cashier'); }}>
                  <PauseCircle size={22} color="var(--info)" />
                  <div className="grow" style={{ textAlign: 'left' }}><div className="bold">{st.held.length} pesanan ditahan</div><div className="tiny muted">Ketuk untuk melanjutkan</div></div>
                  <ChevronRight size={20} className="chev" />
                </button>
              )}
              {debts.length > 0 && (
                <button className="card row" style={{ padding: 14, background: 'var(--accent-soft)', boxShadow: 'none' }} onClick={() => nav.push('debts')}>
                  <HandCoins size={22} color="#C27C00" />
                  <div className="grow" style={{ textAlign: 'left' }}><div className="bold">Kasbon belum lunas {rp(debtTotal)}</div><div className="tiny muted">{debts.length} transaksi</div></div>
                  <ChevronRight size={20} className="chev" />
                </button>
              )}
              {low.length > 0 && (
                <button className="card row" style={{ padding: 14, background: 'var(--expense-soft)', boxShadow: 'none' }} onClick={() => nav.push('products', { filter: 'low' })}>
                  <AlertTriangle size={22} color="var(--expense)" />
                  <div className="grow" style={{ textAlign: 'left' }}><div className="bold">Stok menipis: {low.length} produk</div><div className="tiny muted ellipsis">{low.slice(0, 3).map(p => `${p.name} (${p.stock})`).join(', ')}</div></div>
                  <ChevronRight size={20} className="chev" />
                </button>
              )}
            </div>
          )}

          <div className="section-title">Penjualan 7 hari</div>
          <div className="card"><BarChart data={series} /></div>

          <div className="section-title">Transaksi terakhir {recent.length > 0 && <button onClick={() => nav.tab('history')}>Lihat semua</button>}</div>
          {recent.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div className="bold">Belum ada transaksi</div>
              <div className="small muted mt8">Transaksi yang Anda buat di Kasir akan muncul di sini.</div>
            </div>
          ) : (
            <div className="list">{recent.map(x => <SaleRow key={x.id} sale={x} time={fmtTime(x.date)} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
