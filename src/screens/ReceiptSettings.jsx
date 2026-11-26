import { useMemo, useState } from 'react';
import { ImagePlus, Trash2, Printer, Loader2, Eye } from 'lucide-react';
import { useStore } from '../store.js';
import { toast, nav } from '../ui.js';
import { fx } from '../lib/fx.js';
import { buildSaleReceipt, buildTestReceipt } from '../lib/receipt.js';
import { printBlocks, usePrinter } from '../lib/printer.js';
import { pickFile, readDataUrl, resizeImage } from '../lib/share.js';
import { Page, Field, Toggle, Seg, ReceiptPaper, Sheet } from '../components/ui.jsx';

export function sampleSale(st) {
  const ps = st.products.slice(0, 3);
  const items = ps.length ? ps.map((p, i) => ({ name: p.name, price: p.price, qty: i + 1, disc: 0, total: p.price * (i + 1) })) : [
    { name: 'Nasi Goreng Spesial', price: 18000, qty: 2, disc: 0, total: 36000 },
    { name: 'Es Teh Manis', price: 4000, qty: 2, disc: 0, total: 8000 }
  ];
  const subtotal = items.reduce((a, i) => a + i.total, 0);
  const service = Math.round(subtotal * st.settings.servicePct / 100);
  const tax = Math.round((subtotal + service) * st.settings.taxPct / 100);
  const total = subtotal + service + tax;
  const paid = Math.ceil(total / 50000) * 50000;
  return { no: `${(st.settings.prefix || 'INV').toUpperCase()}-000000-0001`, date: Date.now(), items, qty: items.reduce((a, i) => a + i.qty, 0), subtotal, discount: 0, service, servicePct: st.settings.servicePct, tax, taxPct: st.settings.taxPct, total, method: 'cash', paid, change: paid - total, status: 'paid', customer: 'Bu Ani', cashier: st.settings.cashier, note: '' };
}

const Row = ({ title, sub, children }) => (
  <div className="row" style={{ padding: '10px 0' }}><div className="grow"><div className="bold">{title}</div>{sub && <div className="tiny muted">{sub}</div>}</div>{children}</div>
);

export default function ReceiptSettings() {
  const st = useStore(); const s = st.settings; const set = st.setSettings;
  const busy = usePrinter(p => p.busy);
  const [full, setFull] = useState(false);
  const blocks = useMemo(() => buildSaleReceipt(sampleSale(st), s, { hasLogo: !!st.logo }), [s, st.logo, st.products]);
  const pickLogo = async () => {
    const f = await pickFile('image/*'); if (!f) return;
    try { const d = await readDataUrl(f); st.setLogo(await resizeImage(d, 600)); set({ showLogo: true }); fx('success'); toast('Logo dipasang'); }
    catch { toast('Gambar tidak bisa dibuka', { type: 'error' }); }
  };
  const test = async () => {
    try { await printBlocks(buildTestReceipt(s, { hasLogo: !!st.logo })); fx('print'); toast('Tes cetak terkirim'); }
    catch (e) { fx('error'); toast(e.message, { type: 'error' }); if (e.code === 'NO_PRINTER') nav.push('printer'); }
  };
  return (
    <Page title="Tampilan Struk" sub="Perubahan langsung terlihat di pratinjau"
      right={<button className="icon-btn solid" onClick={() => setFull(true)} aria-label="Pratinjau"><Eye size={21} /></button>}
      footer={<button className="btn primary block" disabled={busy} onClick={test}>{busy ? <Loader2 size={20} className="spin" /> : <Printer size={20} />} Tes cetak struk</button>}>
      <div className="card" style={{ background: 'var(--bg2)', boxShadow: 'none', padding: '14px 18px', maxHeight: 360, overflow: 'hidden', position: 'relative' }} onClick={() => setFull(true)}>
        <ReceiptPaper blocks={blocks} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, background: 'linear-gradient(transparent, var(--bg2))', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10 }}><span className="tag gray" style={{ background: 'var(--surface)' }}>Ketuk untuk lihat penuh</span></div>
      </div>

      <div className="section-title">Identitas toko</div>
      <div className="card">
        <Field label="Nama toko / usaha"><input className="input" value={s.storeName} onChange={e => set({ storeName: e.target.value })} placeholder="Contoh: Warung Bu Ani" /></Field>
        <Field label="Alamat"><textarea className="input" style={{ minHeight: 70 }} value={s.address} onChange={e => set({ address: e.target.value })} placeholder="Jl. Melati No. 5, Banjarmasin" /></Field>
        <Field label="No. telepon / WhatsApp"><input className="input" inputMode="tel" value={s.phone} onChange={e => set({ phone: e.target.value })} placeholder="08xxxxxxxxxx" /></Field>
        <Field label="Teks tambahan di atas (opsional)" hint="Misal: jam buka, Instagram, atau slogan"><input className="input" value={s.header} onChange={e => set({ header: e.target.value })} placeholder="Buka setiap hari 07.00 - 21.00" /></Field>
      </div>

      <div className="section-title">Logo</div>
      <div className="card">
        <div className="row gap12">
          <div style={{ width: 76, height: 76, borderRadius: 18, background: '#fff', border: '1.5px dashed var(--line)', display: 'grid', placeItems: 'center', overflow: 'hidden', flex: 'none' }}>
            {st.logo ? <img src={st.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImagePlus size={28} color="var(--muted)" />}
          </div>
          <div className="grow col gap8">
            <button className="btn soft sm" onClick={pickLogo}><ImagePlus size={18} /> {st.logo ? 'Ganti logo' : 'Pilih logo dari galeri'}</button>
            {st.logo && <button className="btn ghost sm" style={{ color: 'var(--expense)' }} onClick={() => { st.setLogo(null); fx('remove'); }}><Trash2 size={18} /> Hapus logo</button>}
          </div>
        </div>
        {st.logo && <>
          <Row title="Tampilkan logo di struk"><Toggle on={s.showLogo} onChange={v => set({ showLogo: v })} /></Row>
          <Field label={`Lebar logo: ${s.logoWidth}%`}>
            <input type="range" min="25" max="100" step="5" value={s.logoWidth} onChange={e => set({ logoWidth: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--primary)', height: 32 }} />
          </Field>
          <div className="tiny muted">Logo hitam-putih dengan latar putih memberi hasil cetak paling tajam.</div>
        </>}
      </div>

      <div className="section-title">Footer (bagian bawah struk)</div>
      <div className="card">
        <Field label="Teks footer" hint="Tekan Enter untuk baris baru"><textarea className="input" value={s.footer} onChange={e => set({ footer: e.target.value })} placeholder="Terima kasih, selamat datang kembali!" /></Field>
        <div className="row gap8" style={{ flexWrap: 'wrap' }}>
          {['Terima kasih atas kunjungan Anda', 'Barang yang sudah dibeli tidak dapat dikembalikan', 'Follow IG kami @', 'Selamat menikmati 😊'].map(t => (
            <button key={t} className="chip" style={{ height: 34, fontSize: '.8rem' }} onClick={() => { fx('tap'); set({ footer: (s.footer ? s.footer + '\n' : '') + t }); }}>+ {t}</button>
          ))}
        </div>
        <div className="divider" />
        <Row title="QR code di struk" sub="Untuk link Instagram, WhatsApp, Google Maps, dll"><Toggle on={s.showQr} onChange={v => set({ showQr: v })} /></Row>
        {s.showQr && <>
          <Field label="Isi QR (link atau teks)"><input className="input" value={s.qrText} onChange={e => set({ qrText: e.target.value })} placeholder="https://instagram.com/tokosaya" /></Field>
          <Field label="Tulisan di bawah QR"><input className="input" value={s.qrLabel} onChange={e => set({ qrLabel: e.target.value })} /></Field>
        </>}
      </div>

      <div className="section-title">Isi & kertas</div>
      <div className="card">
        <Field label="Ukuran kertas printer"><Seg value={s.paper} onChange={v => set({ paper: v })} options={[{ value: 58, label: '58 mm (kecil)' }, { value: 80, label: '80 mm (besar)' }]} /></Field>
        <Row title="Tampilkan nama kasir"><Toggle on={s.showCashier} onChange={v => set({ showCashier: v })} /></Row>
        <Row title="Tampilkan nama pelanggan"><Toggle on={s.showCustomer} onChange={v => set({ showCustomer: v })} /></Row>
        <Field label="Awalan nomor struk" hint={`Contoh nomor: ${(s.prefix || 'INV').toUpperCase()}-261126-0001`}><input className="input" maxLength={6} value={s.prefix} onChange={e => set({ prefix: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() })} /></Field>
        <Field label="Jumlah salinan setiap cetak"><Seg value={s.copies} onChange={v => set({ copies: v })} options={[{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }]} /></Field>
        <Field label="Jarak kosong setelah struk"><Seg value={s.feedLines} onChange={v => set({ feedLines: v })} options={[{ value: 2, label: 'Pendek' }, { value: 3, label: 'Sedang' }, { value: 5, label: 'Panjang' }]} /></Field>
        {s.paper === 80 && <Row title="Potong kertas otomatis" sub="Untuk printer yang punya pisau (auto-cutter)"><Toggle on={s.autoCut} onChange={v => set({ autoCut: v })} /></Row>}
        <Row title="Cetak otomatis setelah bayar" sub="Struk langsung keluar tanpa menekan Cetak"><Toggle on={s.autoPrint} onChange={v => set({ autoPrint: v })} /></Row>
      </div>

      <Sheet open={full} onClose={() => setFull(false)} title="Pratinjau struk" full>
        <div style={{ background: 'var(--bg2)', borderRadius: 20, padding: '18px 14px' }}><ReceiptPaper blocks={blocks} /></div>
      </Sheet>
    </Page>
  );
}
