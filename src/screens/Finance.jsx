import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Plus, Minus, Trash2, ChevronRight, ShoppingBag } from 'lucide-react';
import { useStore, EXPENSE_CATS, INCOME_CATS } from '../store.js';
import { useUI, nav, toast, confirmDialog } from '../ui.js';
import { rp, fmtTime, relDay, dayKey, periodRange, toDateInput, fromDateInput } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { computeReport, catOf } from '../lib/report.js';
import { Header, Sheet, Field, MoneyInput, Seg, Empty } from '../components/ui.jsx';
import { Donut } from '../components/charts.jsx';
import { ArtWallet } from '../components/art.jsx';

const PALETTE = ['#DC4B3E', '#F2A93B', '#2F6FDB', '#8E5BD8', '#1FA3B5', '#D9488F', '#6B8E23', '#B5651D', '#5B6770', '#0E7C66'];

export function FinanceSheet({ entry, onClose }) {
  const [f, setF] = useState(null);
  useEffect(() => { if (entry) setF({ type: 'out', amount: 0, cat: entry.type === 'in' ? 'lain' : 'bahan', note: '', date: Date.now(), ...entry }); }, [entry]);
  const cats = f?.type === 'in' ? INCOME_CATS : EXPENSE_CATS;
  const isEdit = !!entry?.id;
  const save = () => {
    useStore.getState().saveFinance(f);
    fx('success'); toast(f.type === 'in' ? 'Pemasukan dicatat' : 'Pengeluaran dicatat'); onClose();
  };
  const del = async () => {
    if (!(await confirmDialog({ title: 'Hapus catatan ini?', message: `${catOf(f.type, f.cat).name} ${rp(f.amount)}`, ok: 'Hapus', danger: true }))) return;
    const old = entry; useStore.getState().deleteFinance(f.id); fx('remove'); onClose();
    toast('Catatan dihapus', { action: { label: 'URUNGKAN', fn: () => useStore.getState().restoreFinance(old) } });
  };
  return (
    <Sheet open={!!entry} onClose={onClose} title={isEdit ? 'Ubah catatan' : f?.type === 'in' ? 'Catat pemasukan' : 'Catat pengeluaran'} full
      footer={<div className="row gap12">
        {isEdit && <button className="btn outline" style={{ color: 'var(--expense)', width: 60, padding: 0 }} onClick={del}><Trash2 size={20} /></button>}
        <button className={'btn lg grow ' + (f?.type === 'in' ? 'primary' : 'danger')} disabled={!f?.amount} onClick={save}>Simpan {f?.amount ? rp(f.amount) : ''}</button>
      </div>}>
      {f && <>
        {!isEdit && <Seg value={f.type} onChange={t => setF({ ...f, type: t, cat: t === 'in' ? 'lain' : 'bahan' })} options={[{ value: 'out', label: 'Pengeluaran' }, { value: 'in', label: 'Pemasukan' }]} />}
        <div className="mt16"><Field label="Jumlah uang"><MoneyInput value={f.amount} onChange={v => setF({ ...f, amount: v })} big /></Field></div>
        <Field label="Kategori">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
            {cats.map(c => {
              const on = f.cat === c.id;
              return (
                <motion.button key={c.id} whileTap={{ scale: 0.94 }} onClick={() => { fx('tap'); setF({ ...f, cat: c.id }); }}
                  className="col" style={{ alignItems: 'center', gap: 4, padding: '12px 4px', borderRadius: 16, background: on ? (f.type === 'in' ? 'var(--income-soft)' : 'var(--expense-soft)') : 'var(--surface)', boxShadow: on ? `inset 0 0 0 2px ${f.type === 'in' ? 'var(--income)' : 'var(--expense)'}` : 'var(--shadow)' }}>
                  <span style={{ fontSize: 26 }}>{c.emoji}</span>
                  <span className="tiny bold" style={{ textAlign: 'center', lineHeight: 1.2 }}>{c.name}</span>
                </motion.button>
              );
            })}
          </div>
        </Field>
        <Field label="Keterangan (opsional)"><input className="input" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} placeholder={f.type === 'in' ? 'Contoh: pesanan nasi kotak 20' : 'Contoh: beli beras 10 kg'} /></Field>
        <Field label="Tanggal"><input type="date" className="input" value={toDateInput(f.date)} onChange={e => e.target.value && setF({ ...f, date: fromDateInput(e.target.value, f.date) })} /></Field>
      </>}
    </Sheet>
  );
}

export default function Finance() {
  const st = useStore(); const s = st.settings;
  const [period, setPeriod] = useState('month'); const [view, setView] = useState('out');
  const [entry, setEntry] = useState(null);
  useEffect(() => { const i = useUI.getState().financeIntent; if (i) { setEntry({ type: i }); setView(i); useUI.setState({ financeIntent: null }); } }, []);
  const [from, to, label] = periodRange(period);
  const rep = useMemo(() => computeReport(st, from, to, label), [st.sales, st.finance, period]);
  const list = useMemo(() => st.finance.filter(f => f.date >= from && f.date < to && (view === 'all' || f.type === view)).sort((a, b) => b.date - a.date), [st.finance, period, view]);
  const groups = useMemo(() => { const m = new Map(); list.forEach(x => { const k = dayKey(x.date); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return [...m.entries()]; }, [list]);
  const cats = view === 'in' ? rep.inCats : rep.outCats;
  const totalIn = rep.omzet + rep.otherIn;

  return (
    <div className="page">
      <Header title="Keuangan" sub={label} back={false}
        right={s.pin ? <button className="icon-btn solid" onClick={() => { useUI.getState().lock(); fx('toggle'); nav.tab('home'); toast('Keuangan dikunci'); }} aria-label="Kunci"><Lock size={21} /></button> : null} />
      <div className="chips" style={{ paddingBottom: 10 }}>
        {[['today', 'Hari ini'], ['7d', '7 hari'], ['month', 'Bulan ini'], ['lastmonth', 'Bulan lalu'], ['all', 'Semua']].map(([k, l]) => <button key={k} className={'chip' + (period === k ? ' on' : '')} onClick={() => { fx('tap'); setPeriod(k); }}>{l}</button>)}
      </div>
      <div className="scroll" style={{ paddingBottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 96px)' }}><div className="pad">
        {!s.pin && (
          <button className="card row" style={{ width: '100%', background: 'var(--accent-soft)', boxShadow: 'none', marginBottom: 12, textAlign: 'left' }} onClick={() => nav.push('security')}>
            <ShieldCheck size={26} color="#C27C00" />
            <div className="grow"><div className="bold">Kunci halaman ini dengan PIN</div><div className="tiny muted">Agar pengeluaran & laba tidak dilihat orang lain</div></div>
            <ChevronRight size={20} className="chev" />
          </button>
        )}
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div className="tiny bold muted">Uang masuk</div><div className="bold num green" style={{ fontSize: '1.2rem' }}>{rp(totalIn)}</div><div className="tiny muted">Penjualan {rp(rep.omzet)}</div></div>
            <div><div className="tiny bold muted">Uang keluar</div><div className="bold num red" style={{ fontSize: '1.2rem' }}>{rp(rep.out)}</div><div className="tiny muted">{rep.outCats.length} kategori</div></div>
          </div>
          <div className="dash" />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><div className="tiny bold muted">Laba bersih</div><div className="tiny muted">penjualan − modal barang + pemasukan − pengeluaran</div></div>
            <div className="num" style={{ fontSize: '1.45rem', fontWeight: 800, color: rep.net >= 0 ? 'var(--income)' : 'var(--expense)' }}>{rp(rep.net)}</div>
          </div>
        </div>

        <div className="mt16"><Seg value={view} onChange={setView} options={[{ value: 'out', label: 'Pengeluaran' }, { value: 'in', label: 'Pemasukan' }, { value: 'all', label: 'Semua' }]} /></div>

        {view !== 'all' && cats.length > 0 && (
          <div className="card mt12 row" style={{ gap: 16 }}>
            <Donut parts={cats.map((c, i) => ({ value: c.amount, color: PALETTE[i % PALETTE.length] }))} size={110} stroke={16} />
            <div className="grow col" style={{ gap: 6, minWidth: 0 }}>
              {cats.slice(0, 5).map((c, i) => (
                <div key={c.id} className="row small" style={{ gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: PALETTE[i % PALETTE.length], flex: 'none' }} />
                  <span className="grow ellipsis bold">{c.name}</span><span className="num muted">{rp(c.amount, false)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {groups.length === 0 ? (
          <Empty art={ArtWallet} title={view === 'in' ? 'Belum ada pemasukan lain' : view === 'out' ? 'Belum ada pengeluaran' : 'Belum ada catatan'}
            text={view === 'in' ? 'Penjualan dari kasir sudah tercatat otomatis. Di sini untuk uang masuk lainnya, seperti tambah modal atau pesanan.' : 'Catat belanja bahan, gaji, listrik, dan biaya lain supaya laba terlihat jelas.'} />
        ) : groups.map(([k, items]) => (
          <div key={k}>
            <div className="section-title"><span>{relDay(k)}</span></div>
            <div className="list">
              {items.map(f => { const c = catOf(f.type, f.cat); return (
                <button key={f.id} className="li" onClick={() => { fx('tap'); setEntry(f); }}>
                  <div className="ic" style={{ background: f.type === 'in' ? 'var(--income-soft)' : 'var(--expense-soft)', fontSize: 22 }}>{c.emoji}</div>
                  <div className="grow" style={{ minWidth: 0 }}><div className="t ellipsis">{f.note || c.name}</div><div className="s">{c.name} · {fmtTime(f.date)}</div></div>
                  <div className={'bold num ' + (f.type === 'in' ? 'green' : 'red')}>{f.type === 'in' ? '+' : '-'}{rp(f.amount)}</div>
                </button>
              ); })}
            </div>
          </div>
        ))}
        {view === 'in' && rep.omzet > 0 && <button className="btn ghost block mt12" onClick={() => nav.tab('history')}><ShoppingBag size={18} /> Lihat penjualan ({rep.count} transaksi)</button>}
      </div></div>

      <div className="row gap12 fab-row" style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 14px)', zIndex: 5 }}>
        <button className="btn grow" style={{ background: 'var(--income)', color: '#fff', boxShadow: '0 6px 18px rgba(23,163,74,.3)' }} onClick={() => { fx('tap'); setEntry({ type: 'in' }); }}><Plus size={20} /> Pemasukan</button>
        <button className="btn danger grow" onClick={() => { fx('tap'); setEntry({ type: 'out' }); }}><Minus size={20} /> Pengeluaran</button>
      </div>
      <FinanceSheet entry={entry} onClose={() => setEntry(null)} />
    </div>
  );
}
