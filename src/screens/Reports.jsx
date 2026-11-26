import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Printer, FileSpreadsheet, TrendingUp, Loader2, Trophy } from 'lucide-react';
import { useStore, methodName, fmtQty } from '../store.js';
import { toast } from '../ui.js';
import { rp, periodRange, fmtDate, fmtTime, toDateInput } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { computeReport, dailySeries, catOf } from '../lib/report.js';
import { buildReportReceipt } from '../lib/receipt.js';
import { printBlocks, usePrinter } from '../lib/printer.js';
import { shareFile, toCsv } from '../lib/share.js';
import { Page, Sheet, Empty } from '../components/ui.jsx';
import { BarChart } from '../components/charts.jsx';
import { ArtChart } from '../components/art.jsx';

export default function Reports() {
  const st = useStore();
  const [period, setPeriod] = useState('today');
  const [exp, setExp] = useState(false);
  const busy = usePrinter(p => p.busy);
  const [from, to, label] = periodRange(period);
  const rep = useMemo(() => computeReport(st, from, to, label), [st.sales, st.finance, period]);
  const series = useMemo(() => dailySeries(st, 7), [st.sales, st.finance]);
  const margin = rep.omzet ? Math.round((rep.gross / rep.omzet) * 100) : 0;

  const print = async () => {
    try { if (await printBlocks(buildReportReceipt(rep, st.settings), { name: 'laporan' }) === 'web') return; fx('print'); toast('Laporan dicetak'); }
    catch (e) { fx('error'); toast(e.message, { type: 'error' }); }
  };
  const doExport = async kind => {
    const inRange = x => x.date >= from && x.date < to;
    const stamp = toDateInput(Date.now());
    let rows, name;
    if (kind === 'sales') {
      rows = [['No Struk', 'Tanggal', 'Jam', 'Pelanggan', 'Jumlah Barang', 'Subtotal', 'Diskon', 'Layanan', 'Pajak', 'Total', 'Modal', 'Laba', 'Metode', 'Status', 'Catatan']];
      st.sales.filter(inRange).forEach(s => rows.push([s.no, fmtDate(s.date), fmtTime(s.date), s.customer, s.qty, s.subtotal, s.discount, s.service, s.tax, s.total, s.cost || 0, s.total - (s.cost || 0), methodName(s.method), s.status === 'void' ? 'Batal' : s.status === 'debt' ? 'Kasbon' : 'Lunas', s.note]));
      name = `penjualan-${stamp}.csv`;
    } else if (kind === 'items') {
      rows = [['No Struk', 'Tanggal', 'Barang', 'Jumlah', 'Satuan', 'Harga', 'Diskon', 'Total', 'Modal']];
      st.sales.filter(x => inRange(x) && x.status !== 'void').forEach(s => s.items.forEach(i => rows.push([s.no, fmtDate(s.date), i.name, String(i.qty).replace('.', ','), i.unit || 'pcs', i.price, i.disc || 0, i.total ?? i.price * i.qty, (i.cost || 0) * i.qty])));
      name = `barang-terjual-${stamp}.csv`;
    } else {
      rows = [['Tanggal', 'Jam', 'Jenis', 'Kategori', 'Keterangan', 'Jumlah']];
      st.finance.filter(inRange).forEach(f => rows.push([fmtDate(f.date), fmtTime(f.date), f.type === 'in' ? 'Pemasukan' : 'Pengeluaran', catOf(f.type, f.cat).name, f.note, f.type === 'in' ? f.amount : -f.amount]));
      name = `keuangan-${stamp}.csv`;
    }
    try { await shareFile(name, toCsv(rows), { mime: 'text/csv', title: 'Ekspor ' + name }); fx('success'); setExp(false); }
    catch (e) { if (!/cancel/i.test(e?.message || '')) toast('Gagal ekspor: ' + e.message, { type: 'error' }); }
  };

  const Stat = ({ label, value, color, sub }) => (
    <div className="card" style={{ padding: 14 }}>
      <div className="tiny bold muted">{label}</div>
      <div className="bold num mt8" style={{ fontSize: '1.1rem', color }}>{value}</div>
      {sub && <div className="tiny muted">{sub}</div>}
    </div>
  );

  return (
    <Page title="Laporan" sub={label} noPad
      footer={<div className="row gap12">
        <button className="btn outline grow" onClick={() => setExp(true)}><FileSpreadsheet size={20} /> Ekspor Excel</button>
        <button className="btn primary grow" disabled={busy} onClick={print}>{busy ? <Loader2 size={20} className="spin" /> : <Printer size={20} />} Cetak laporan</button>
      </div>}>
      <div className="chips" style={{ paddingBottom: 12 }}>
        {[['today', 'Hari ini'], ['yesterday', 'Kemarin'], ['7d', '7 hari'], ['month', 'Bulan ini'], ['lastmonth', 'Bulan lalu'], ['all', 'Semua']].map(([k, l]) => <button key={k} className={'chip' + (period === k ? ' on' : '')} onClick={() => { fx('tap'); setPeriod(k); }}>{l}</button>)}
      </div>
      <div className="pad">
        <motion.div key={period} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ background: rep.net >= 0 ? 'linear-gradient(150deg, var(--primary-2), var(--primary-dark))' : 'linear-gradient(150deg, #E86A5E, #B8382D)', color: '#fff' }}>
          <div className="row"><TrendingUp size={20} /><span className="small bold" style={{ opacity: 0.9 }}>Laba bersih · {label}</span></div>
          <div className="num" style={{ fontSize: '2.1rem', fontWeight: 800, margin: '6px 0 2px' }}>{rp(rep.net)}</div>
          <div className="small" style={{ opacity: 0.9 }}>Penjualan {rp(rep.omzet)} · margin {margin}%</div>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <Stat label="Penjualan (omzet)" value={rp(rep.omzet)} sub={`${rep.count} transaksi`} />
          <Stat label="Modal barang" value={rp(rep.cost)} sub="dari harga modal produk" />
          <Stat label="Laba kotor" value={rp(rep.gross)} color="var(--income)" sub="penjualan − modal" />
          <Stat label="Rata-rata / transaksi" value={rp(rep.avg)} sub={`${rep.qty} barang terjual`} />
          <Stat label="Pemasukan lain" value={rp(rep.otherIn)} color="var(--income)" />
          <Stat label="Pengeluaran" value={rp(rep.out)} color="var(--expense)" />
        </div>
        {rep.debtOpen > 0 && <div className="card mt12" style={{ background: 'var(--accent-soft)', boxShadow: 'none' }}><div className="kv"><span>Kasbon belum lunas (periode ini)</span><b className="num">{rp(rep.debtOpen)}</b></div></div>}

        <div className="section-title">Penjualan vs pengeluaran (7 hari)</div>
        <div className="card">
          <BarChart data={series} second />
          <div className="row gap16 mt12 tiny bold muted" style={{ justifyContent: 'center' }}>
            <span className="row" style={{ gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--primary)' }} />Penjualan</span>
            <span className="row" style={{ gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--expense)' }} />Pengeluaran</span>
          </div>
        </div>

        {rep.count === 0 && rep.out === 0 && rep.otherIn === 0 ? (
          <Empty art={ArtChart} title="Belum ada data" text="Laporan akan terisi otomatis dari transaksi kasir dan catatan keuangan." />
        ) : <>
          {rep.methods.length > 0 && <>
            <div className="section-title">Metode pembayaran</div>
            <div className="card">
              {rep.methods.map(m => {
                const pct = rep.omzet ? m.amount / rep.omzet : 0;
                return (
                  <div key={m.id} style={{ marginBottom: 12 }}>
                    <div className="kv" style={{ padding: '2px 0' }}><span className="bold" style={{ color: 'var(--text)' }}>{m.name}</span><span className="num bold">{rp(m.amount)}</span></div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--bg2)', overflow: 'hidden' }}><motion.div initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} style={{ height: '100%', background: 'var(--primary)', borderRadius: 4 }} /></div>
                  </div>
                );
              })}
            </div>
          </>}
          {rep.top.length > 0 && <>
            <div className="section-title">Produk terlaris</div>
            <div className="list">
              {rep.top.slice(0, 10).map((p, i) => (
                <div key={p.name + i} className="li">
                  <div className="ic" style={{ background: i < 3 ? 'var(--accent-soft)' : 'var(--bg2)', color: i < 3 ? '#C27C00' : 'var(--muted)', fontWeight: 800 }}>{i === 0 ? <Trophy size={20} /> : i + 1}</div>
                  <div className="grow" style={{ minWidth: 0 }}><div className="t ellipsis">{p.emoji ? p.emoji + ' ' : ''}{p.name}</div><div className="s num">{rp(p.amount)} · untung {rp(p.profit)}</div></div>
                  <div className="bold">{fmtQty(p.qty, p.unit)}{!p.unit || p.unit === 'pcs' ? '×' : ''}</div>
                </div>
              ))}
            </div>
          </>}
          {rep.outCats.length > 0 && <>
            <div className="section-title">Rincian pengeluaran</div>
            <div className="list">
              {rep.outCats.map(c => <div key={c.id} className="li"><div className="ic" style={{ background: 'var(--expense-soft)', fontSize: 22 }}>{c.emoji}</div><div className="grow t">{c.name}</div><div className="bold num red">{rp(c.amount)}</div></div>)}
            </div>
          </>}
        </>}
      </div>
      <Sheet open={exp} onClose={() => setExp(false)} title="Ekspor ke Excel">
        <p className="small muted" style={{ marginTop: 0 }}>File CSV untuk periode <b>{label}</b>. Bisa dibuka di Excel, Google Sheets, atau dikirim lewat WhatsApp.</p>
        <div className="list">
          {[['sales', 'Daftar penjualan', 'Satu baris per struk'], ['items', 'Rincian barang terjual', 'Satu baris per barang'], ['finance', 'Pemasukan & pengeluaran', 'Catatan keuangan']].map(([k, t, s]) => (
            <button key={k} className="li" onClick={() => doExport(k)}><div className="ic" style={{ background: 'var(--income-soft)', color: 'var(--income)' }}><FileSpreadsheet size={22} /></div><div className="grow"><div className="t">{t}</div><div className="s">{s}</div></div></button>
          ))}
        </div>
      </Sheet>
    </Page>
  );
}
