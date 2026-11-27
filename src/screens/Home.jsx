import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Printer, ShoppingBag, ArrowDownCircle, ArrowUpCircle, Package, BarChart3, Lock, ChevronRight, AlertTriangle, PauseCircle, HandCoins, Bluetooth, Eye } from 'lucide-react';
import { useStore } from '../store.js';
import { Sheet } from '../components/ui.jsx';
import { toast } from '../ui.js';
import { ChevronDown, Target, DatabaseBackup, DoorOpen, DoorClosed } from 'lucide-react';
import { useUI, nav } from '../ui.js';
import { usePrinter, isNative } from '../lib/printer.js';
import { storage } from '../lib/storage.js';
import { X, Share as ShareIcon, SquarePlus } from 'lucide-react';
import { computeReport, dailySeries } from '../lib/report.js';
import { rp, greeting, fmtDateLong, fmtTime, startOfDay } from '../lib/format.js';
import { BarChart } from '../components/charts.jsx';
import { fx } from '../lib/fx.js';
import { SaleRow } from './Sales.jsx';

export function PrinterPill() {
  const p = usePrinter(); const name = useStore(s => s.settings.printerName);
  const on = p.state === 'connected';
  const color = on ? 'var(--income)' : p.state === 'connecting' ? 'var(--accent)' : 'var(--muted)';
  if (!isNative) return null;
  return (
    <button onClick={() => nav.push('printer')} className="row" style={{ gap: 7, height: 40, padding: '0 12px', borderRadius: 20, background: 'var(--surface)', boxShadow: 'var(--shadow)', fontSize: '.8rem', fontWeight: 800, color }}>
      {on ? <Printer size={17} /> : <Bluetooth size={17} className={p.state === 'connecting' ? 'pulse' : ''} />}
      <span className="ellipsis" style={{ maxWidth: 92 }}>{on ? (p.name || name || 'Printer') : p.state === 'connecting' ? 'Menyambung…' : 'Printer'}</span>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
    </button>
  );
}

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;

function InstallHint() {
  const [hide, setHide] = useState(() => isNative || standalone() || !isIOS || storage.get('installHintHidden', false));
  if (hide) return null;
  return (
    <div className="card row" style={{ background: 'var(--info-soft)', boxShadow: 'none', marginBottom: 12, alignItems: 'flex-start', gap: 12 }}>
      <SquarePlus size={26} color="var(--info)" style={{ flex: 'none' }} />
      <div className="grow small" style={{ lineHeight: 1.5 }}>
        <div className="bold" style={{ fontSize: '1rem' }}>Pasang StrukKu di layar utama</div>
        Ketuk tombol <b>Bagikan</b> <ShareIcon size={15} style={{ verticalAlign: -2 }} /> di Safari, lalu pilih <b>“Tambah ke Layar Utama”</b>. Setelah itu StrukKu terbuka seperti aplikasi biasa.
      </div>
      <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => { storage.set('installHintHidden', true); setHide(true); }} aria-label="Tutup"><X size={18} /></button>
    </div>
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
  const [pick, setPick] = useState(false);
  const [newName, setNewName] = useState('');
  const names = [...new Set([s.cashier, ...(s.cashiers || [])].filter(Boolean))];
  const addName = () => { const n = newName.trim(); if (!n) return; useStore.getState().setSettings({ cashiers: [...new Set([...(s.cashiers || []), n])], cashier: n }); setNewName(''); fx('success'); setPick(false); toast(`Kasir sekarang: ${n}`); };

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
          <button className="sub row" style={{ gap: 4 }} onClick={() => setPick(true)}>{greeting()}{s.cashier ? `, ${s.cashier}` : ''} 👋 <ChevronDown size={14} /></button>
          <h1 style={{ fontSize: '1.35rem' }}>{s.storeName || 'Toko Saya'}</h1>
        </div>
        <PrinterPill />
      </div>
      <div className="scroll with-tabbar">
        <div className="pad">
          <InstallHint />
          {st.sales.length >= 10 && Date.now() - (s.lastBackup || 0) > 7 * 864e5 && (
            <button className="card row" style={{ width: '100%', textAlign: 'left', background: 'var(--accent-soft)', boxShadow: 'none', marginBottom: 12, gap: 12 }} onClick={async () => { if (await useUI.getState().requirePin('settings', 'Buka Pengaturan')) nav.push('backup'); }}>
              <DatabaseBackup size={24} color="#C27C00" />
              <div className="grow"><div className="bold">Cadangkan data Anda</div><div className="tiny muted">{s.lastBackup ? 'Sudah lebih dari 7 hari sejak cadangan terakhir' : 'Belum pernah membuat cadangan'} — supaya aman kalau HP rusak/hilang</div></div>
              <ChevronRight size={20} className="chev" />
            </button>
          )}
          <button className="card row" style={{ width: '100%', textAlign: 'left', padding: '12px 14px', marginBottom: 12, gap: 12, boxShadow: 'none', background: st.shift ? 'var(--income-soft)' : 'var(--surface2)', border: '1px solid var(--line)' }} onClick={() => nav.push('shift')}>
            {st.shift ? <DoorOpen size={22} color="var(--income)" /> : <DoorClosed size={22} color="var(--muted)" />}
            <div className="grow small"><b>{st.shift ? `Kasir buka sejak ${fmtTime(st.shift.openAt)}` : 'Kasir belum dibuka'}</b><span className="muted">{st.shift ? ` · ${st.shift.cashier || ''}` : ' · ketuk untuk buka & hitung uang laci'}</span></div>
            <ChevronRight size={18} className="chev" />
          </button>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ background: 'linear-gradient(150deg, var(--primary-2), var(--primary-dark))', color: '#fff', padding: 20, position: 'relative', overflow: 'hidden' }}>
            <svg width="190" height="190" viewBox="0 0 200 200" style={{ position: 'absolute', right: -50, top: -50, opacity: 0.12 }}><circle cx="100" cy="100" r="90" fill="none" stroke="#fff" strokeWidth="26" /><circle cx="100" cy="100" r="40" fill="#fff" /></svg>
            <div className="small" style={{ opacity: 0.85, fontWeight: 700 }}>Penjualan hari ini · {fmtDateLong(Date.now()).split(',')[0]}</div>
            <div className="num" style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-.02em', margin: '4px 0 2px' }}>{rp(today.omzet)}</div>
            <div className="small" style={{ opacity: 0.9, fontWeight: 600 }}>{today.count} transaksi · {today.qty} {s.bizType === 'laundry' || s.bizType === 'service' ? 'item' : 'barang terjual'}</div>
            {s.dailyTarget > 0 && (() => { const pct = Math.min(100, Math.round(today.omzet / s.dailyTarget * 100)); return (
              <div className="mt12">
                <div className="row tiny bold" style={{ justifyContent: 'space-between', opacity: 0.95 }}><span><Target size={13} style={{ verticalAlign: -2 }} /> Target {rp(s.dailyTarget)}</span><span>{pct >= 100 ? 'Tercapai 🎉' : `${pct}%`}</span></div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,.25)', marginTop: 6, overflow: 'hidden' }}><motion.div initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ duration: 0.8 }} style={{ height: '100%', borderRadius: 4, background: pct >= 100 ? '#FFD36B' : '#fff' }} /></div>
              </div>); })()}
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
      <Sheet open={pick} onClose={() => setPick(false)} title="Siapa yang jaga kasir?">
        <p className="small muted" style={{ marginTop: 0 }}>Nama kasir tercetak di struk dan bisa dilihat di laporan per kasir.</p>
        {names.length > 0 && <div className="list">{names.map(n => (
          <button key={n} className="li" onClick={() => { useStore.getState().setSettings({ cashier: n }); fx('tap'); setPick(false); toast(`Kasir sekarang: ${n}`); }}>
            <div className="ic" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800 }}>{n.slice(0, 1).toUpperCase()}</div>
            <div className="grow t">{n}</div>{s.cashier === n && <span className="tag green">Sedang jaga</span>}
          </button>))}</div>}
        <div className="row gap8 mt12"><input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tambah nama kasir" /><button className="btn primary sm" style={{ height: 54 }} disabled={!newName.trim()} onClick={addName}>Tambah</button></div>
      </Sheet>
    </div>
  );
}
