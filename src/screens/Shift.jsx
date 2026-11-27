import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DoorOpen, DoorClosed, Printer, Wallet, Clock, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useStore, shiftSummary } from '../store.js';
import { toast, confirmDialog } from '../ui.js';
import { rp, fmtDateTime, fmtTime, relDay } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { buildShiftReceipt } from '../lib/receipt.js';
import { printBlocks } from '../lib/printer.js';
import { Page, Field, MoneyInput, Sheet, ReceiptPaper, Empty } from '../components/ui.jsx';
import { ArtWallet } from '../components/art.jsx';

async function printShift(sh) {
  try { if (await printBlocks(buildShiftReceipt(sh, useStore.getState().settings), { name: 'tutup-kasir' }) === 'web') return; fx('print'); toast('Laporan kasir dicetak'); }
  catch (e) { fx('error'); toast(e.message, { type: 'error' }); }
}

const Line = ({ l, v, bold, color }) => <div className="kv" style={bold ? { fontSize: '1.05rem' } : null}><span style={bold ? { color: 'var(--text)', fontWeight: 800 } : null}>{l}</span><span className="num" style={{ fontWeight: bold ? 800 : 600, color }}>{v}</span></div>;

export default function Shift() {
  const st = useStore(); const s = st.settings;
  const [openCash, setOpenCash] = useState(0);
  const [who, setWho] = useState(s.cashier || '');
  const [counted, setCounted] = useState(0);
  const [note, setNote] = useState('');
  const [view, setView] = useState(null);
  const sh = st.shift;
  const sum = useMemo(() => (sh ? shiftSummary(st, sh) : null), [sh, st.sales, st.finance]);
  const names = [...new Set([s.cashier, ...(s.cashiers || [])].filter(Boolean))];

  const open = () => {
    useStore.getState().openShift(openCash, who.trim());
    if (who.trim()) useStore.getState().setSettings({ cashier: who.trim() });
    fx('success'); toast('Kasir dibuka. Selamat berjualan!'); setOpenCash(0);
  };
  const close = async () => {
    const diff = counted - sum.expected;
    if (!(await confirmDialog({ title: 'Tutup kasir sekarang?', message: diff === 0 ? 'Uang di laci pas dengan catatan. 👍' : `Ada selisih ${diff > 0 ? '+' : ''}${rp(diff)} dari yang seharusnya ${rp(sum.expected)}.`, ok: 'Tutup kasir', icon: DoorClosed }))) return;
    const done = useStore.getState().closeShift(counted, note.trim());
    fx('cash'); setCounted(0); setNote(''); setView(done);
  };

  return (
    <Page title="Buka / Tutup Kasir" sub={sh ? `Dibuka ${relDay(sh.openAt).toLowerCase()} ${fmtTime(sh.openAt)}` : 'Hitung uang laci setiap hari'}>
      {!sh ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="row"><div className="icon-circle" style={{ background: 'var(--income-soft)', color: 'var(--income)', width: 52, height: 52, borderRadius: 18 }}><DoorOpen size={26} /></div>
            <div><div className="bold" style={{ fontSize: '1.1rem' }}>Kasir belum dibuka</div><div className="small muted">Catat uang modal di laci sebelum mulai berjualan</div></div></div>
          <div className="mt16"><Field label="Uang modal di laci (kembalian)"><MoneyInput value={openCash} onChange={setOpenCash} big /></Field></div>
          <div className="row gap8" style={{ flexWrap: 'wrap', marginTop: -4, marginBottom: 14 }}>{[0, 50000, 100000, 200000, 300000].map(v => <button key={v} className={'chip' + (openCash === v ? ' on' : '')} onClick={() => setOpenCash(v)}>{v ? rp(v) : 'Kosong'}</button>)}</div>
          <Field label="Nama kasir">
            <input className="input" value={who} onChange={e => setWho(e.target.value)} placeholder="Contoh: Ani" />
            {names.length > 0 && <div className="row gap8 mt8" style={{ flexWrap: 'wrap' }}>{names.map(n => <button key={n} className={'chip' + (who === n ? ' on' : '')} onClick={() => setWho(n)}>{n}</button>)}</div>}
          </Field>
          <button className="btn primary block lg" onClick={open}><DoorOpen size={21} /> Buka Kasir</button>
        </motion.div>
      ) : (
        <>
          <div className="card" style={{ background: 'linear-gradient(150deg, var(--primary-2), var(--primary-dark))', color: '#fff' }}>
            <div className="row small bold" style={{ opacity: 0.9 }}><Clock size={16} /> Buka sejak {fmtDateTime(sh.openAt)}{sh.cashier ? ` · ${sh.cashier}` : ''}</div>
            <div className="small mt8" style={{ opacity: 0.85 }}>Uang yang seharusnya ada di laci</div>
            <div className="num" style={{ fontSize: '2rem', fontWeight: 800 }}>{rp(sum.expected)}</div>
            <div className="small" style={{ opacity: 0.9 }}>{sum.count} transaksi · penjualan {rp(sum.omzet)}</div>
          </div>
          <div className="card mt12">
            <Line l="Modal awal" v={rp(sh.openCash)} />
            <Line l="+ Penjualan tunai" v={rp(sum.cashSales)} color="var(--income)" />
            {sum.cashDebtPaid > 0 && <Line l="+ Bayar kasbon tunai" v={rp(sum.cashDebtPaid)} color="var(--income)" />}
            {sum.otherIn > 0 && <Line l="+ Pemasukan lain" v={rp(sum.otherIn)} color="var(--income)" />}
            {sum.out > 0 && <Line l="− Pengeluaran" v={rp(sum.out)} color="var(--expense)" />}
            <div className="dash" />
            <Line l="Seharusnya di laci" v={rp(sum.expected)} bold />
            <div className="divider" />
            <Line l="Non-tunai (QRIS, transfer, e-wallet)" v={rp(sum.nonCash)} />
            <Line l="Kasbon baru" v={rp(sum.debtNew)} />
          </div>
          <div className="section-title">Tutup kasir</div>
          <div className="card">
            <Field label="Uang yang dihitung di laci sekarang"><MoneyInput value={counted} onChange={setCounted} big /></Field>
            {counted > 0 && (() => { const d = counted - sum.expected; return (
              <div className="row small bold" style={{ gap: 8, marginBottom: 12, color: d === 0 ? 'var(--income)' : d > 0 ? 'var(--info)' : 'var(--expense)' }}>
                {d === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{d === 0 ? 'Pas, tidak ada selisih' : d > 0 ? `Lebih ${rp(d)}` : `Kurang ${rp(-d)}`}
              </div>); })()}
            <Field label="Catatan (opsional)"><input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Contoh: uang diambil untuk belanja" /></Field>
            <div className="row gap8">
              <button className="btn outline" onClick={() => printShift({ ...sh, summary: sum, expected: sum.expected })}><Printer size={19} /></button>
              <button className="btn danger grow lg" onClick={close}><DoorClosed size={21} /> Tutup Kasir</button>
            </div>
          </div>
        </>
      )}

      <div className="section-title">Riwayat tutup kasir</div>
      {st.shifts.length === 0 ? <Empty art={ArtWallet} title="Belum ada riwayat" text="Setiap kali kasir ditutup, ringkasannya tersimpan di sini." /> : (
        <div className="list">
          {st.shifts.slice(0, 60).map(x => (
            <button key={x.id} className="li" onClick={() => { fx('tap'); setView(x); }}>
              <div className="ic" style={{ background: x.diff === 0 ? 'var(--income-soft)' : 'var(--accent-soft)', color: x.diff === 0 ? 'var(--income)' : '#C27C00' }}><Wallet size={20} /></div>
              <div className="grow" style={{ minWidth: 0 }}><div className="t">{relDay(x.openAt)} · {fmtTime(x.openAt)}–{fmtTime(x.closeAt)}</div><div className="s">{x.cashier || 'Kasir'} · {x.summary?.count || 0} transaksi · {rp(x.summary?.omzet || 0)}</div></div>
              <span className={'tag ' + (x.diff === 0 ? 'green' : x.diff > 0 ? 'blue' : 'red')}>{x.diff === 0 ? 'Pas' : (x.diff > 0 ? '+' : '') + rp(x.diff)}</span>
              <ChevronRight size={18} className="chev" />
            </button>
          ))}
        </div>
      )}
      <Sheet open={!!view} onClose={() => setView(null)} title="Laporan tutup kasir" full footer={<button className="btn primary block lg" onClick={() => printShift(view)}><Printer size={20} /> Cetak</button>}>
        {view && <div style={{ background: 'var(--bg2)', borderRadius: 20, padding: '18px 14px' }}><ReceiptPaper blocks={buildShiftReceipt(view, s)} /></div>}
      </Sheet>
    </Page>
  );
}
