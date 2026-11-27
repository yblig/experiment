import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, QrCode, Landmark, Smartphone, HandCoins, Printer, Share2, ShoppingBag, Search, Ban, CheckCircle2, X, Loader2, ChevronRight } from 'lucide-react';
import { useStore, methodName } from '../store.js';
import { useUI, nav, toast, confirmDialog } from '../ui.js';
import { rp, fmtTime, relDay, dayKey, fmtDateTime, periodRange } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { buildSaleReceipt, prepareImages, renderReceiptCanvas } from '../lib/receipt.js';
import { printBlocks, usePrinter } from '../lib/printer.js';
import { shareCanvas } from '../lib/share.js';
import { Page, Header, ReceiptPaper, Empty, Sheet, Field, MoneyInput, Seg, useSelection, useLongPress, CheckCircle, SelectHeader, ActionBar, ActionBtn } from '../components/ui.jsx';
import { buildLabelReceipt, blocksToText } from '../lib/receipt.js';
import { shareFile, toCsv } from '../lib/share.js';
import { isNative } from '../lib/printer.js';
import { RotateCcw, MessageSquareText, Tag as TagIcon, FileDown, CalendarRange, Minus, Plus } from 'lucide-react';
import { toDateInput, fromDateInput, fmtDate } from '../lib/format.js';
import { ArtReceipt } from '../components/art.jsx';
import { useWorkActions, workOf } from './Orders.jsx';
import { dueLabel } from './Cashier.jsx';
import { CalendarClock, MessageCircle, PackageCheck } from 'lucide-react';

const MI = { cash: Banknote, qris: QrCode, transfer: Landmark, ewallet: Smartphone, debt: HandCoins };
const MC = { cash: ['var(--income)', 'var(--income-soft)'], qris: ['var(--info)', 'var(--info-soft)'], transfer: ['#7A4FD0', 'color-mix(in srgb, #7A4FD0 14%, var(--surface))'], ewallet: ['#1FA3B5', 'color-mix(in srgb, #1FA3B5 14%, var(--surface))'], debt: ['#C27C00', 'var(--accent-soft)'] };

export const paidOf = s => (s.payments || []).reduce((a, p) => a + p.amount, 0);

export function StatusTag({ sale }) {
  if (sale.status === 'void') return <span className="tag gray">Batal</span>;
  if (sale.status === 'debt') return <span className="tag amber">{useStore.getState().settings.trackOrders ? 'Belum bayar' : 'Kasbon'}</span>;
  return <span className="tag green">Lunas</span>;
}

export function SaleRow({ sale, time, sel }) {
  const Icon = MI[sale.method] || Banknote; const [c, bg] = MC[sale.method] || MC.cash;
  const lp = useLongPress(() => { if (sel && !sel.on) sel.start(sale.id); });
  const picked = sel?.has(sale.id);
  return (
    <button className="li" {...(sel ? lp : {})} onClick={() => { if (sel && lp.wasLong()) return; if (sel?.on) { sel.toggle(sale.id); return; } fx('tap'); nav.push('sale', { id: sale.id }); }}
      style={{ ...(sale.status === 'void' && !picked ? { opacity: 0.55 } : null), ...(picked ? { background: 'var(--primary-soft)' } : null) }}>
      {sel?.on && <CheckCircle on={picked} />}
      <div className="ic" style={{ background: bg, color: c }}><Icon size={21} /></div>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="t ellipsis">{sale.customer || sale.items.map(i => i.name).join(', ')}</div>
        <div className="s ellipsis">{time} · {sale.qty} item · {methodName(sale.method)}{sale.queue ? ` · antrian ${sale.queue}` : ''}{sale.cashier ? ` · ${sale.cashier}` : ''}</div>
      </div>
      <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
        <div className="bold num" style={{ textDecoration: sale.status === 'void' ? 'line-through' : 'none' }}>{rp(sale.total)}</div>
        <StatusTag sale={sale} />
      </div>
    </button>
  );
}

// ---------- print / share helpers ----------
export async function printSale(sale, copy = '') {
  const st = useStore.getState();
  const blocks = buildSaleReceipt(sale, st.settings, { hasLogo: !!st.logo, copy });
  try {
    if (await printBlocks(blocks, { copies: copy ? 1 : st.settings.copies, name: `struk-${sale.no}` }) === 'web') return true;
    fx('print'); toast('Struk berhasil dicetak');
    return true;
  } catch (e) {
    fx('error');
    if (e.code === 'NO_PRINTER') {
      if (await confirmDialog({ title: 'Printer belum diatur', message: 'Sambungkan printer struk Bluetooth Anda terlebih dahulu.', ok: 'Atur Printer', icon: Printer })) nav.push('printer');
    } else {
      if (await confirmDialog({ title: 'Gagal mencetak', message: e.message, ok: 'Buka pengaturan printer', cancel: 'Tutup', danger: true })) nav.push('printer');
    }
    return false;
  }
}

export async function shareSaleText(sale) {
  const st = useStore.getState();
  const text = blocksToText(buildSaleReceipt(sale, { ...st.settings, paper: 58, showQr: false }, { hasLogo: false }), 58);
  try { await shareFile(`struk-${sale.no}.txt`, text, { mime: 'text/plain', title: 'Kirim struk', text }); }
  catch (e) { if (!/cancel|abort/i.test(e?.message || '')) toast('Gagal membagikan', { type: 'error' }); }
}
export function repeatOrder(sale) {
  const st = useStore.getState();
  if (st.cart.items.length) st.holdCart('Pesanan sebelumnya');
  const n = st.repeatSale(sale.id);
  fx('success'); toast(`${n} item dimasukkan ke kasir${st.held.length ? '' : ''}`);
  nav.root(); useUI.getState().setTab('cashier');
}
export async function printLabels(sale, count) {
  const st = useStore.getState();
  for (let i = 1; i <= count; i++) {
    const r = await printBlocks(buildLabelReceipt(sale, st.settings, { index: i, total: count }), { name: `label-${sale.no}-${i}` }).catch(e => { toast(e.message, { type: 'error' }); return 'err'; });
    if (r === 'web' || r === 'err') return;
  }
  fx('print'); toast(count > 1 ? `${count} label dicetak` : 'Label dicetak');
}

export async function shareSale(sale) {
  const st = useStore.getState();
  const blocks = buildSaleReceipt(sale, st.settings, { hasLogo: !!st.logo });
  try {
    const imgs = await prepareImages(blocks, st.settings, st.logo);
    const c = await renderReceiptCanvas(blocks, imgs, st.settings, 2);
    await shareCanvas(c, `struk-${sale.no}.png`, `Struk ${st.settings.storeName} ${sale.no} - Total ${rp(sale.total)}`);
  } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('Gagal membagikan: ' + (e.message || e), { type: 'error' }); }
}

function PrintBtn({ sale, copy, className = 'btn primary grow', label = 'Cetak' }) {
  const busy = usePrinter(p => p.busy);
  return <button className={className} disabled={busy} onClick={() => printSale(sale, copy)}>{busy ? <Loader2 size={20} className="spin" /> : <Printer size={20} />} {busy ? 'Mencetak…' : label}</button>;
}

// ---------- done ----------
export function SaleDone({ saleId, print }) {
  const sale = useStore(s => s.sales.find(x => x.id === saleId));
  const s = useStore(st => st.settings); const logo = useStore(st => st.logo);
  const did = useRef(false);
  useEffect(() => { if (sale && (print || s.autoPrint) && !did.current) { did.current = true; setTimeout(() => printSale(sale), 450); } }, []);
  if (!sale) return null;
  const blocks = buildSaleReceipt(sale, s, { hasLogo: !!logo });
  const finish = () => { nav.root(); useUI.getState().setTab('cashier'); };
  return (
    <div className="page">
      <Header title="Transaksi berhasil" onBack={finish} />
      <div className="scroll"><div className="pad" style={{ paddingBottom: 24 }}>
        <div className="col" style={{ alignItems: 'center', textAlign: 'center' }}>
          <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 11, stiffness: 260, delay: 0.05 }}
            style={{ width: 84, height: 84, borderRadius: 30, background: 'linear-gradient(150deg, #34D27F, var(--income))', display: 'grid', placeItems: 'center', boxShadow: '0 10px 30px rgba(23,163,74,.35)' }}>
            <motion.svg width="44" height="44" viewBox="0 0 24 24"><motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.4 }} /></motion.svg>
          </motion.div>
          <div className="bold mt16" style={{ fontSize: '1.1rem' }}>{sale.status === 'debt' ? 'Kasbon tercatat' : 'Pembayaran diterima'}</div>
          <div className="num" style={{ fontSize: '2rem', fontWeight: 800 }}>{rp(sale.total)}</div>
          {sale.method === 'cash' && sale.change > 0 && (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="card mt12" style={{ background: 'var(--income-soft)', boxShadow: 'none', padding: '12px 22px' }}>
              <div className="small bold muted">Kembalian</div>
              <div className="num green" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{rp(sale.change)}</div>
            </motion.div>
          )}
          {sale.status === 'debt' && <div className="small muted mt8">Sisa kasbon {sale.customer}: <b>{rp(sale.total - paidOf(sale))}</b></div>}
        </div>
        <div className="mt24"><ReceiptPaper blocks={blocks} /></div>
      </div></div>
      <div className="sheet-foot col gap8">
        <div className="row gap8">
          <button className="btn outline" onClick={() => shareSale(sale)}><Share2 size={20} /> Kirim</button>
          <PrintBtn sale={sale} className="btn soft grow" label="Cetak struk" />
        </div>
        <button className="btn primary lg block" onClick={finish}><ShoppingBag size={21} /> Transaksi Baru</button>
      </div>
    </div>
  );
}

// ---------- detail ----------
export function SaleDetail({ id }) {
  const sale = useStore(s => s.sales.find(x => x.id === id));
  const s = useStore(st => st.settings); const logo = useStore(st => st.logo);
  const [payOpen, setPayOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);
  const actions = useWorkActions();
  if (!sale) return <Page title="Transaksi"><Empty title="Transaksi tidak ditemukan" /></Page>;
  const blocks = buildSaleReceipt(sale, s, { hasLogo: !!logo });
  const remaining = sale.total - paidOf(sale);
  const doVoid = async () => {
    if (!(await useUI.getState().requirePin('void', 'PIN untuk membatalkan'))) return;
    if (!(await confirmDialog({ title: 'Batalkan transaksi?', message: `${sale.no} senilai ${rp(sale.total)} akan dibatalkan dan stok barang dikembalikan. Tindakan ini tidak bisa diurungkan.`, ok: 'Ya, batalkan', danger: true }))) return;
    useStore.getState().voidSale(sale.id); fx('remove'); toast('Transaksi dibatalkan');
  };
  return (
    <Page title={sale.no} sub={fmtDateTime(sale.date)}
      footer={sale.status === 'void' ? null : (
        <div className="row gap8">
          <button className="btn outline" onClick={() => shareSale(sale)} aria-label="Bagikan"><Share2 size={20} /></button>
          {sale.status === 'debt' && <button className="btn accent grow" onClick={() => setPayOpen(true)}><HandCoins size={20} /> Lunasi</button>}
          <PrintBtn sale={sale} copy="SALINAN / CETAK ULANG" label="Cetak ulang" className={'btn grow ' + (sale.status === 'debt' ? 'soft' : 'primary')} />
        </div>
      )}>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div><div className="tiny bold muted">Total</div><div className="bold num" style={{ fontSize: '1.4rem' }}>{rp(sale.total)}</div></div>
        <div className="col" style={{ alignItems: 'flex-end', gap: 6 }}><StatusTag sale={sale} /><span className="small muted">{methodName(sale.method)}</span></div>
      </div>
      {sale.status === 'debt' && <div className="card mt12" style={{ background: 'var(--accent-soft)', boxShadow: 'none' }}>
        <div className="kv"><span>Sudah dibayar</span><span className="num">{rp(paidOf(sale))}</span></div>
        <div className="kv"><span className="bold" style={{ color: 'var(--text)' }}>Sisa kasbon</span><span className="num bold">{rp(remaining)}</span></div>
      </div>}
      {sale.work && sale.status !== 'void' && (() => { const w = workOf(sale.work); return (
        <div className="card mt12" style={{ background: w.bg, boxShadow: 'none' }}>
          <div className="row"><span className="bold grow" style={{ color: w.color }}>Status: {w.name}</span>{sale.due && sale.work !== 'done' ? <span className="small bold"><CalendarClock size={14} style={{ verticalAlign: -2 }} /> {dueLabel(sale.due)}</span> : null}</div>
          {sale.work !== 'done' && <div className="row gap8 mt12">
            {sale.work === 'process' && <button className="btn primary sm grow" onClick={() => actions.markReady(sale)}><CheckCircle2 size={18} /> Tandai selesai</button>}
            {sale.work === 'ready' && <><button className="btn sm" style={{ background: '#25D366', color: '#fff' }} onClick={() => actions.notify(sale)}><MessageCircle size={18} /> WA</button>
              <button className="btn primary sm grow" onClick={() => actions.markDone(sale)}><PackageCheck size={18} /> Sudah diambil</button></>}
          </div>}
        </div>); })()}
      {actions.paySheet}
      {sale.payments?.length > 0 && <div className="card mt12">
        <div className="bold small">Riwayat pembayaran</div>
        {sale.payments.map((p, i) => <div key={i} className="kv small"><span>{fmtDateTime(p.date)} · {methodName(p.method)}</span><span className="num">{rp(p.amount)}</span></div>)}
      </div>}
      <div className="row gap8 mt12" style={{ flexWrap: 'wrap' }}>
        <button className="btn sm soft grow" onClick={() => repeatOrder(sale)}><RotateCcw size={17} /> Ulangi pesanan</button>
        <button className="btn sm outline grow" onClick={() => shareSaleText(sale)}><MessageSquareText size={17} /> Kirim teks</button>
        {(sale.due || sale.work || useStore.getState().settings.trackOrders) && <button className="btn sm outline grow" onClick={() => setLabelOpen(true)}><TagIcon size={17} /> Cetak label</button>}
      </div>
      <LabelSheet sale={labelOpen ? sale : null} onClose={() => setLabelOpen(false)} />
      <div className="section-title">Struk</div>
      <ReceiptPaper blocks={blocks} />
      {sale.status !== 'void' && <button className="btn ghost block mt24" style={{ color: 'var(--expense)' }} onClick={doVoid}><Ban size={20} /> Batalkan transaksi</button>}
      <PayDebtSheet sale={payOpen ? sale : null} onClose={() => setPayOpen(false)} />
    </Page>
  );
}

export function PayDebtSheet({ sale, onClose }) {
  const [amt, setAmt] = useState(0); const [m, setM] = useState('cash');
  const remaining = sale ? sale.total - paidOf(sale) : 0;
  useEffect(() => { if (sale) { setAmt(remaining); setM('cash'); } }, [sale?.id]);
  const save = () => {
    useStore.getState().payDebt(sale.id, Math.min(amt, remaining), m);
    fx('cash'); toast(amt >= remaining ? 'Kasbon lunas 🎉' : `Pembayaran ${rp(amt)} dicatat`); onClose();
  };
  return (
    <Sheet open={!!sale} onClose={onClose} title="Bayar kasbon" footer={<button className="btn primary block lg" disabled={!amt} onClick={save}><CheckCircle2 size={20} /> Simpan pembayaran</button>}>
      {sale && <>
        <div className="card flat"><div className="kv"><span>{sale.customer}</span><span className="num bold">Sisa {rp(remaining)}</span></div></div>
        <div className="mt16"><Field label="Jumlah dibayar"><MoneyInput value={amt} onChange={v => setAmt(Math.min(v, remaining))} big /></Field></div>
        <div className="row gap8"><button className="btn sm soft" onClick={() => setAmt(remaining)}>Lunas semua</button><button className="btn sm outline" onClick={() => setAmt(Math.round(remaining / 2))}>Setengah</button></div>
        <div className="mt16"><Field label="Dibayar dengan"><Seg value={m} onChange={setM} options={[{ value: 'cash', label: 'Tunai' }, { value: 'qris', label: 'QRIS' }, { value: 'transfer', label: 'Transfer' }]} /></Field></div>
      </>}
    </Sheet>
  );
}

// ---------- history tab ----------
function LabelSheet({ sale, onClose }) {
  const [n, setN] = useState(1);
  const s = useStore(st => st.settings);
  useEffect(() => { if (sale) setN(1); }, [sale?.id]);
  return (
    <Sheet open={!!sale} onClose={onClose} title="Cetak label" footer={<button className="btn primary block lg" onClick={() => { printLabels(sale, n); onClose(); }}><Printer size={20} /> Cetak {n} label</button>}>
      {sale && <>
        <p className="small muted" style={{ marginTop: 0 }}>Label kecil untuk ditempel di {s.bizType === 'laundry' ? 'kantong cucian' : 'pesanan'}: nama pelanggan, no. nota, jumlah & tanggal selesai.</p>
        <Field label={s.bizType === 'laundry' ? 'Jumlah kantong' : 'Jumlah label'}>
          <div className="row" style={{ justifyContent: 'center', gap: 16 }}>
            <button className="icon-btn solid" onClick={() => setN(Math.max(1, n - 1))}><Minus size={20} /></button>
            <div className="bold num" style={{ fontSize: '2rem', minWidth: 50, textAlign: 'center' }}>{n}</div>
            <button className="icon-btn solid" onClick={() => setN(Math.min(20, n + 1))}><Plus size={20} /></button>
          </div>
        </Field>
        <div style={{ background: 'var(--bg2)', borderRadius: 20, padding: '14px 10px' }}><ReceiptPaper blocks={buildLabelReceipt(sale, s, { index: 1, total: n })} /></div>
      </>}
    </Sheet>
  );
}

export function DateRangeChips({ period, setPeriod, range, setRange, options }) {
  return (
    <>
      <div className="chips" style={{ paddingBottom: period === 'custom' ? 8 : 6 }}>
        {options.map(([k, l]) => <button key={k} className={'chip' + (period === k ? ' on' : '')} onClick={() => { fx('tap'); setPeriod(k); }}>{l}</button>)}
        <button className={'chip' + (period === 'custom' ? ' on' : '')} onClick={() => { fx('tap'); setPeriod('custom'); }}><CalendarRange size={15} /> Pilih tanggal</button>
      </div>
      {period === 'custom' && (
        <div className="pad row gap8" style={{ paddingBottom: 8 }}>
          <input type="date" className="input" value={range[0]} max={range[1]} onChange={e => e.target.value && setRange([e.target.value, range[1]])} />
          <span className="muted bold">–</span>
          <input type="date" className="input" value={range[1]} min={range[0]} onChange={e => e.target.value && setRange([range[0], e.target.value])} />
        </div>
      )}
    </>
  );
}
export function rangeOf(period, range) {
  if (period !== 'custom') return periodRange(period);
  const from = new Date(fromDateInput(range[0])).setHours(0, 0, 0, 0);
  const to = new Date(fromDateInput(range[1])).setHours(0, 0, 0, 0) + 864e5;
  return [from, to, range[0] === range[1] ? fmtDate(from) : `${fmtDate(from)} – ${fmtDate(to - 1)}`];
}
export const defaultRange = () => [toDateInput(Date.now() - 6 * 864e5), toDateInput(Date.now())];

export function History() {
  const sales = useStore(s => s.sales);
  const [q, setQ] = useState(''); const [status, setStatus] = useState('all'); const [period, setPeriod] = useState('all');
  const [range, setRange] = useState(defaultRange);
  const sel = useSelection();
  const filtered = useMemo(() => {
    const [from, to] = rangeOf(period, range);
    const t = q.trim().toLowerCase();
    return sales.filter(x => x.date >= from && x.date < to
      && (status === 'all' || x.status === status)
      && (!t || x.no.toLowerCase().includes(t) || (x.customer || '').toLowerCase().includes(t) || x.items.some(i => i.name.toLowerCase().includes(t))));
  }, [sales, q, status, period, range]);
  const groups = useMemo(() => {
    const m = new Map();
    filtered.forEach(x => { const k = dayKey(x.date); if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
    return [...m.entries()];
  }, [filtered]);
  const total = filtered.filter(x => x.status !== 'void').reduce((a, x) => a + x.total, 0);
  const chosen = filtered.filter(x => sel.has(x.id));
  const chosenTotal = chosen.filter(x => x.status !== 'void').reduce((a, x) => a + x.total, 0);
  const exportSel = async () => {
    const rows = [['No Struk', 'Tanggal', 'Jam', 'Pelanggan', 'Barang', 'Total', 'Metode', 'Status']];
    chosen.forEach(x => rows.push([x.no, fmtDate(x.date), fmtTime(x.date), x.customer, x.items.map(i => `${i.qty} ${i.name}`).join(', '), x.total, methodName(x.method), x.status === 'void' ? 'Batal' : x.status === 'debt' ? 'Belum lunas' : 'Lunas']));
    try { await shareFile(`transaksi-terpilih-${toDateInput(Date.now())}.csv`, toCsv(rows), { mime: 'text/csv', title: 'Ekspor transaksi' }); fx('success'); }
    catch (e) { if (!/cancel|abort/i.test(e?.message || '')) toast('Gagal ekspor', { type: 'error' }); }
  };
  const summary = async () => {
    const st = useStore.getState().settings;
    const text = `*${st.storeName}* — Rekap ${chosen.length} transaksi\n` + chosen.map(x => `• ${x.no} ${x.customer ? '(' + x.customer + ') ' : ''}${rp(x.total)}${x.status === 'void' ? ' [batal]' : x.status === 'debt' ? ' [belum lunas]' : ''}`).join('\n') + `\n\n*Total: ${rp(chosenTotal)}*`;
    try { await shareFile('rekap.txt', text, { mime: 'text/plain', title: 'Rekap transaksi', text }); } catch { /* cancelled */ }
  };
  const reprint = async () => { for (const x of chosen) { const ok = await printSale(x, 'SALINAN / CETAK ULANG'); if (!ok) break; } sel.clear(); };
  return (
    <div className="page">
      {sel.on ? <SelectHeader selection={sel} allIds={filtered.map(x => x.id)} label={`dipilih · ${rp(chosenTotal)}`} />
        : <Header title="Riwayat Transaksi" sub={`${filtered.length} transaksi · ${rp(total)}`} back={false}
          right={filtered.length > 0 ? <button className="icon-btn solid" onClick={() => sel.start()} aria-label="Pilih banyak"><CheckCircle2 size={21} /></button> : null} />}
      <div className="pad" style={{ paddingBottom: 10 }}>
        <div className="search"><Search size={20} /><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Cari no. struk, pelanggan, barang…" />
          {q && <button onClick={() => setQ('')} style={{ position: 'absolute', right: 12, top: 13 }}><X size={20} color="var(--muted)" /></button>}</div>
      </div>
      <DateRangeChips period={period} setPeriod={setPeriod} range={range} setRange={setRange} options={[['all', 'Semua waktu'], ['today', 'Hari ini'], ['yesterday', 'Kemarin'], ['7d', '7 hari'], ['month', 'Bulan ini']]} />
      <div className="chips" style={{ paddingBottom: 10 }}>
        {[['all', 'Semua status'], ['paid', 'Lunas'], ['debt', 'Kasbon'], ['void', 'Dibatalkan']].map(([k, l]) => <button key={k} className={'chip' + (status === k ? ' on' : '')} onClick={() => { fx('tap'); setStatus(k); }}>{l}</button>)}
      </div>
      <div className="scroll with-tabbar"><div className="pad">
        {groups.length === 0 ? (
          <Empty art={ArtReceipt} title={sales.length ? 'Tidak ada yang cocok' : 'Belum ada transaksi'} text={sales.length ? 'Coba ubah pencarian atau filter.' : 'Semua struk yang Anda buat akan tersimpan rapi di sini.'}
            action={!sales.length && <button className="btn primary" onClick={() => nav.tab('cashier')}><ShoppingBag size={20} /> Buka Kasir</button>} />
        ) : groups.map(([k, list]) => (
          <div key={k}>
            <div className="section-title"><span>{relDay(k)}</span><span className="num" style={{ textTransform: 'none', letterSpacing: 0 }}>{rp(list.filter(x => x.status !== 'void').reduce((a, x) => a + x.total, 0))}</span></div>
            <div className="list">{list.map(x => <SaleRow key={x.id} sale={x} time={fmtTime(x.date)} sel={sel} />)}</div>
          </div>
        ))}
      </div></div>
      <ActionBar show={sel.on}>
        <ActionBtn icon={FileDown} label="Ekspor" disabled={!chosen.length} onClick={exportSel} />
        <ActionBtn icon={MessageSquareText} label="Kirim rekap" disabled={!chosen.length} onClick={summary} />
        {isNative && <ActionBtn icon={Printer} label="Cetak ulang" disabled={!chosen.length} onClick={reprint} />}
      </ActionBar>
    </div>
  );
}
