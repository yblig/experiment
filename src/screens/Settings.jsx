import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, KeyRound, Trash2, Sun, Moon, Smartphone, Volume2, Vibrate, Type, Download, Upload, AlertTriangle, ChevronDown, Lock, Wallet, BarChart3, Settings, Ban, DoorOpen, Database } from 'lucide-react';
import { useStore } from '../store.js';
import { useUI, nav, toast, confirmDialog } from '../ui.js';
import { fx } from '../lib/fx.js';
import { hashPin } from '../lib/pin.js';
import { rp, toDateInput } from '../lib/format.js';
import { shareFile, pickFile, readText } from '../lib/share.js';
import { Page, Toggle, Seg, Field, PinPad, MoneyInput, NumInput, useBack, Sheet } from '../components/ui.jsx';
import { ArtLock, ArtShop } from '../components/art.jsx';
import pkg from '../../package.json';

const QUESTIONS = ['Siapa nama ibu kandung Anda?', 'Di kota mana Anda lahir?', 'Apa nama sekolah SD Anda?', 'Apa makanan favorit Anda?', 'Siapa nama hewan peliharaan pertama Anda?'];

const Row = ({ icon: Icon, title, sub, children, color = 'var(--primary)', bg = 'var(--primary-soft)' }) => (
  <div className="li" style={{ cursor: 'default' }}>
    {Icon && <div className="ic" style={{ background: bg, color }}><Icon size={21} /></div>}
    <div className="grow" style={{ minWidth: 0 }}><div className="t">{title}</div>{sub && <div className="s">{sub}</div>}</div>
    {children}
  </div>
);

// ---------- PIN setup flow ----------
function PinSetup({ open, onClose }) {
  const [step, setStep] = useState('new'); const [first, setFirst] = useState(''); const [err, setErr] = useState(null);
  const [q, setQ] = useState(QUESTIONS[0]); const [a, setA] = useState(''); const [custom, setCustom] = useState(false);
  useBack(() => close(), open);
  const close = () => { setStep('new'); setFirst(''); setErr(null); setA(''); onClose(); };
  const finish = async () => {
    useStore.getState().setSettings({ pin: await hashPin(first), pinQ: q.trim(), pinA: a.trim() ? await hashPin(a) : null });
    useUI.setState({ unlocked: true, unlockedAt: Date.now() });
    fx('success'); toast('PIN berhasil dipasang 🔒'); close();
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'var(--bg)', display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) + 30px)', paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          {step === 'new' && <PinPad title="Buat PIN baru" sub="Masukkan 4 angka yang mudah Anda ingat" onCancel={close} onDone={p => { setFirst(p); setErr(null); setStep('confirm'); fx('tap'); }} />}
          {step === 'confirm' && <PinPad key="c" title="Ulangi PIN" sub="Masukkan PIN yang sama sekali lagi" error={err} onCancel={() => setStep('new')} onDone={p => { if (p === first) { setStep('question'); fx('success'); } else { fx('error'); setErr(e => ({ msg: 'PIN tidak sama, coba lagi', n: (e?.n || 0) + 1 })); } }} />}
          {step === 'question' && (
            <div className="pad col" style={{ flex: 1, overflowY: 'auto' }}>
              <div className="icon-circle" style={{ background: 'var(--accent-soft)', color: '#C27C00', margin: '0 auto' }}><KeyRound size={30} /></div>
              <h2 style={{ textAlign: 'center', margin: '14px 0 4px', fontWeight: 800 }}>Pertanyaan pemulihan</h2>
              <p className="muted small" style={{ textAlign: 'center', marginTop: 0 }}>Dipakai jika Anda lupa PIN. Jawaban tidak peka huruf besar/kecil.</p>
              <div className="card">
                <Field label="Pertanyaan">
                  {!custom ? (
                    <div className="col gap8">{QUESTIONS.map(x => <button key={x} className={'chip' + (q === x ? ' on' : '')} style={{ justifyContent: 'flex-start', height: 'auto', minHeight: 44, padding: '10px 14px', whiteSpace: 'normal', textAlign: 'left' }} onClick={() => setQ(x)}>{x}</button>)}
                      <button className="chip" style={{ height: 44 }} onClick={() => { setCustom(true); setQ(''); }}>Tulis pertanyaan sendiri…</button></div>
                  ) : <input className="input" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Tulis pertanyaan" />}
                </Field>
                <Field label="Jawaban"><input className="input" value={a} onChange={e => setA(e.target.value)} placeholder="Jawaban Anda" /></Field>
              </div>
              <button className="btn primary block lg mt16" disabled={!q.trim() || !a.trim()} onClick={finish}>Simpan PIN</button>
              <button className="btn ghost block mt8" onClick={() => { setQ(''); setA(''); finish(); }}>Lewati (tanpa pemulihan)</button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Security() {
  const s = useStore(st => st.settings); const setLock = useStore(st => st.setLock);
  const [setup, setSetup] = useState(false);
  const removePin = async () => {
    if (!(await confirmDialog({ title: 'Hapus PIN?', message: 'Keuangan dan laporan bisa dibuka siapa saja tanpa PIN.', ok: 'Hapus PIN', danger: true }))) return;
    useStore.getState().setSettings({ pin: null, pinQ: '', pinA: null }); fx('remove'); toast('PIN dihapus');
  };
  const areas = [
    ['finance', Wallet, 'Keuangan & pengeluaran', 'Halaman Keuangan, angka pengeluaran & laba di Beranda'],
    ['reports', BarChart3, 'Laporan & laba rugi', 'Halaman Laporan'],
    ['void', Ban, 'Batalkan transaksi', 'Mencegah karyawan menghapus penjualan'],
    ['settings', Settings, 'Pengaturan toko', 'Tampilan struk, pajak, cadangan data'],
    ['app', DoorOpen, 'Saat membuka aplikasi', 'Minta PIN setiap kali aplikasi dibuka']
  ];
  return (
    <Page title="Keamanan & PIN">
      {!s.pin ? (
        <div className="col" style={{ alignItems: 'center', textAlign: 'center' }}>
          <ArtLock />
          <h2 style={{ margin: '8px 0 6px', fontWeight: 800 }}>Lindungi data keuangan</h2>
          <p className="muted" style={{ marginTop: 0, lineHeight: 1.5, maxWidth: 340 }}>Pasang PIN 4 angka agar pengeluaran, laba, dan laporan hanya bisa dibuka oleh Anda. Kasir tetap bisa dipakai karyawan.</p>
          <button className="btn primary lg block" style={{ maxWidth: 340 }} onClick={() => setSetup(true)}><ShieldCheck size={21} /> Buat PIN</button>
        </div>
      ) : <>
        <div className="card row" style={{ background: 'var(--income-soft)', boxShadow: 'none' }}>
          <ShieldCheck size={28} color="var(--income)" />
          <div className="grow"><div className="bold">PIN aktif</div><div className="small muted">{s.pinQ ? 'Pertanyaan pemulihan sudah diatur' : 'Tanpa pertanyaan pemulihan'}</div></div>
        </div>
        <div className="section-title">Yang dikunci dengan PIN</div>
        <div className="list">
          {areas.map(([k, Icon, t, sub]) => <Row key={k} icon={Icon} title={t} sub={sub}><Toggle on={!!s.lock[k]} onChange={v => setLock({ [k]: v })} /></Row>)}
        </div>
        <div className="col gap8 mt16">
          <button className="btn soft block" onClick={() => setSetup(true)}><KeyRound size={20} /> Ganti PIN</button>
          <button className="btn outline block" onClick={() => { useUI.getState().lock(); fx('toggle'); toast('Dikunci. PIN akan diminta lagi.'); }}><Lock size={20} /> Kunci sekarang</button>
          <button className="btn ghost block" style={{ color: 'var(--expense)' }} onClick={removePin}><Trash2 size={20} /> Hapus PIN</button>
        </div>
        <div className="small muted mt16" style={{ textAlign: 'center' }}>PIN otomatis terkunci lagi saat aplikasi ditutup atau setelah 10 menit.</div>
      </>}
      <PinSetup open={setup} onClose={() => setSetup(false)} />
    </Page>
  );
}

export function Appearance() {
  const s = useStore(st => st.settings); const set = useStore(st => st.setSettings);
  return (
    <Page title="Tampilan & Suara">
      <div className="section-title" style={{ marginTop: 6 }}>Tema</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[['light', Sun, 'Terang'], ['dark', Moon, 'Gelap'], ['system', Smartphone, 'Ikut HP']].map(([k, Icon, l]) => (
          <motion.button key={k} whileTap={{ scale: 0.95 }} onClick={() => { fx('tap'); set({ theme: k }); }} className="card col" style={{ alignItems: 'center', gap: 8, boxShadow: s.theme === k ? 'inset 0 0 0 2.5px var(--primary), var(--shadow)' : 'var(--shadow)' }}>
            <Icon size={26} color={s.theme === k ? 'var(--primary)' : 'var(--muted)'} /><span className="bold small">{l}</span>
          </motion.button>
        ))}
      </div>
      <div className="section-title">Kenyamanan</div>
      <div className="list">
        <Row icon={Type} title="Tulisan besar" sub="Semua tulisan & tombol jadi lebih besar"><Toggle on={s.bigText} onChange={v => set({ bigText: v })} /></Row>
        <Row icon={Volume2} title="Suara tombol" sub="Bunyi saat menekan & bayar" color="var(--info)" bg="var(--info-soft)"><Toggle on={s.sound} onChange={v => set({ sound: v })} /></Row>
        <Row icon={Vibrate} title="Getar" sub="Getaran halus saat menekan" color="#8E5BD8" bg="color-mix(in srgb, #8E5BD8 14%, var(--surface))"><Toggle on={s.haptics} onChange={v => set({ haptics: v })} /></Row>
      </div>
    </Page>
  );
}

export function CashierSettings() {
  const s = useStore(st => st.settings); const set = useStore(st => st.setSettings);
  const qc = s.quickCash || [10000, 20000, 50000, 100000];
  return (
    <Page title="Kasir & Pajak">
      <div className="card">
        <Field label="Nama kasir" hint="Tampil di struk"><input className="input" value={s.cashier} onChange={e => set({ cashier: e.target.value })} placeholder="Contoh: Ani" /></Field>
        <div className="row gap12">
          <div className="grow"><Field label="Pajak / PPN (%)"><NumInput value={s.taxPct || ''} placeholder="0" onChange={v => set({ taxPct: Math.min(100, Number(v) || 0) })} /></Field></div>
          <div className="grow"><Field label="Biaya layanan (%)"><NumInput value={s.servicePct || ''} placeholder="0" onChange={v => set({ servicePct: Math.min(100, Number(v) || 0) })} /></Field></div>
        </div>
        <div className="tiny muted">Isi 0 jika tidak memakai pajak atau biaya layanan.</div>
      </div>
      <div className="section-title">Tombol uang cepat (tunai)</div>
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {qc.map((v, i) => <MoneyInput key={i} value={v} onChange={n => { const a = [...qc]; a[i] = n; set({ quickCash: a }); }} />)}
        </div>
      </div>
      <div className="section-title">Stok</div>
      <div className="card">
        <Field label="Peringatan stok menipis jika sisa ≤" hint="Produk dengan stok di bawah angka ini diberi tanda"><NumInput value={s.lowStock} onChange={v => set({ lowStock: parseInt(v) || 0 })} /></Field>
      </div>
      <div className="list mt16">
        <Row title="Cetak otomatis setelah bayar" sub="Tanpa perlu menekan tombol Cetak"><Toggle on={s.autoPrint} onChange={v => set({ autoPrint: v })} /></Row>
      </div>
    </Page>
  );
}

export function Backup() {
  const st = useStore();
  const backup = async () => {
    try {
      const data = JSON.stringify(st.exportData());
      await shareFile(`strukku-cadangan-${toDateInput(Date.now())}.json`, data, { mime: 'application/json', title: 'Simpan cadangan StrukKu', text: 'File cadangan StrukKu' });
      fx('success');
    } catch (e) { if (!/cancel/i.test(e?.message || '')) toast('Gagal: ' + e.message, { type: 'error' }); }
  };
  const restore = async () => {
    const f = await pickFile('application/json,.json,text/plain,*/*'); if (!f) return;
    try {
      const d = JSON.parse(await readText(f));
      if (d.app !== 'StrukKu') throw new Error('File ini bukan cadangan StrukKu');
      if (!(await confirmDialog({ title: 'Pulihkan data?', message: `Data saat ini akan diganti dengan cadangan berisi ${d.sales?.length || 0} transaksi dan ${d.products?.length || 0} produk.`, ok: 'Pulihkan', danger: true }))) return;
      st.importData(d); fx('success'); toast('Data berhasil dipulihkan');
    } catch (e) { fx('error'); toast(e.message || 'File tidak valid', { type: 'error' }); }
  };
  const wipeTx = async () => {
    if (!(await confirmDialog({ title: 'Hapus semua transaksi?', message: 'Semua penjualan, catatan keuangan, dan kasbon akan dihapus. Produk & pengaturan tetap. Sebaiknya cadangkan dulu.', ok: 'Hapus transaksi', danger: true }))) return;
    useStore.setState({ sales: [], finance: [], held: [], counter: 0 }); fx('remove'); toast('Transaksi dihapus');
  };
  const wipeAll = async () => {
    if (!(await confirmDialog({ title: 'Reset seluruh aplikasi?', message: 'SEMUA data termasuk produk, pelanggan, dan pengaturan akan hilang permanen.', ok: 'Reset semua', danger: true }))) return;
    st.resetAll(false); fx('remove'); nav.root(); toast('Aplikasi direset');
  };
  return (
    <Page title="Cadangkan & Pulihkan">
      <div className="card">
        <div className="row"><Database size={24} color="var(--primary)" /><div className="bold">Data di HP ini</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }}>
          {[['Transaksi', st.sales.length], ['Produk', st.products.length], ['Catatan keuangan', st.finance.length], ['Pelanggan', st.customers.length]].map(([l, n]) => <div key={l} className="card flat" style={{ padding: 12 }}><div className="tiny muted bold">{l}</div><div className="bold" style={{ fontSize: '1.2rem' }}>{n}</div></div>)}
        </div>
      </div>
      <div className="small muted mt12" style={{ lineHeight: 1.5 }}>Data tersimpan di HP ini saja. Buat cadangan secara rutin dan simpan ke Google Drive atau kirim ke WhatsApp sendiri, agar data aman jika HP rusak atau ganti HP.</div>
      <div className="col gap8 mt16">
        <button className="btn primary lg block" onClick={backup}><Download size={21} /> Buat file cadangan</button>
        <button className="btn soft block" onClick={restore}><Upload size={20} /> Pulihkan dari file</button>
      </div>
      <div className="section-title">Zona berbahaya</div>
      <div className="col gap8">
        <button className="btn outline block" style={{ color: 'var(--expense)' }} onClick={wipeTx}><Trash2 size={20} /> Hapus semua transaksi</button>
        <button className="btn outline block" style={{ color: 'var(--expense)' }} onClick={wipeAll}><AlertTriangle size={20} /> Reset seluruh aplikasi</button>
      </div>
    </Page>
  );
}

const GUIDE = [
  ['Membuat transaksi', 'Tekan tombol Kasir di tengah bawah → ketuk barang (ketuk lagi untuk menambah jumlah) → Lihat & Bayar → pilih cara bayar → Bayar & Cetak.'],
  ['Menyambung printer', 'Nyalakan printer, pasangkan di Pengaturan Bluetooth HP (PIN biasanya 0000 atau 1234), lalu buka Menu → Printer Bluetooth → Sambungkan.'],
  ['Mengubah nama toko & footer', 'Menu → Tampilan Struk. Isi nama toko, alamat, logo, dan teks footer. Pratinjau langsung berubah.'],
  ['Mencatat pengeluaran', 'Beranda → Catat Pengeluaran, atau tab Keuangan → tombol Pengeluaran. Pilih kategori, isi jumlah, simpan.'],
  ['Kasbon (bayar nanti)', 'Saat bayar pilih Kasbon dan isi nama pelanggan. Lunasi nanti dari Menu → Kasbon.'],
  ['Menahan pesanan', 'Di halaman pesanan tekan tombol ⏸ untuk menyimpan sementara, lalu layani pembeli lain. Lanjutkan dari ikon ⏸ di Kasir.'],
  ['Mengunci dengan PIN', 'Menu → Keamanan & PIN → Buat PIN. Atur bagian mana saja yang dikunci.'],
  ['Pindah HP', 'Menu → Cadangkan & Pulihkan → Buat file cadangan. Di HP baru pilih Pulihkan dari file.']
];

export function About() {
  const [open, setOpen] = useState(0);
  return (
    <Page title="Tentang & Bantuan">
      <div className="col" style={{ alignItems: 'center', textAlign: 'center' }}>
        <ArtShop size={130} />
        <div className="bold" style={{ fontSize: '1.4rem' }}>StrukKu</div>
        <div className="small muted">Kasir, struk & pembukuan · versi {pkg.version}</div>
      </div>
      <div className="section-title">Panduan singkat</div>
      <div className="list">
        {GUIDE.map(([t, d], i) => (
          <button key={t} className="li" style={{ flexDirection: 'column', alignItems: 'stretch' }} onClick={() => { fx('tap'); setOpen(open === i ? -1 : i); }}>
            <div className="row"><div className="grow t">{t}</div><ChevronDown size={20} style={{ transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} className="chev" /></div>
            <AnimatePresence initial={false}>{open === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}><div className="small muted" style={{ paddingTop: 8, lineHeight: 1.5 }}>{d}</div></motion.div>}</AnimatePresence>
          </button>
        ))}
      </div>
      <div className="small muted mt24" style={{ textAlign: 'center', lineHeight: 1.5 }}>Semua data tersimpan di HP Anda, tidak dikirim ke internet.</div>
    </Page>
  );
}
