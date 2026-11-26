import { ClipboardList, Briefcase, Receipt, Printer, Package, Tags, Users, HandCoins, BarChart3, ShieldCheck, Palette, DatabaseBackup, Info, ChevronRight, Calculator, Store } from 'lucide-react';
import { useStore, bizOf } from '../store.js';
import { useUI, nav } from '../ui.js';
import { usePrinter, isNative } from '../lib/printer.js';
import { rp } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { Header } from '../components/ui.jsx';

function Item({ icon: Icon, color, bg, title, sub, onClick, right }) {
  return (
    <button className="li" onClick={() => { fx('tap'); onClick(); }}>
      <div className="ic" style={{ background: bg, color }}><Icon size={22} /></div>
      <div className="grow" style={{ minWidth: 0 }}><div className="t">{title}</div>{sub && <div className="s ellipsis">{sub}</div>}</div>
      {right}
      <ChevronRight size={20} className="chev" />
    </button>
  );
}

export default function Menu() {
  const st = useStore(); const s = st.settings;
  const pr = usePrinter();
  const debts = st.sales.filter(x => x.status === 'debt');
  const debtTotal = debts.reduce((a, x) => a + x.total - (x.payments || []).reduce((b, p) => b + p.amount, 0), 0);
  const guard = (area, title, page) => async () => { if (await useUI.getState().requirePin(area, title)) nav.push(page); };
  const set = (page) => guard('settings', 'Buka Pengaturan', page);
  return (
    <div className="page">
      <Header title="Menu" back={false} />
      <div className="scroll with-tabbar"><div className="pad">
        <button className="card row" style={{ width: '100%', textAlign: 'left', gap: 14 }} onClick={() => { fx('tap'); set('receiptSettings')(); }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'var(--primary-soft)', display: 'grid', placeItems: 'center', overflow: 'hidden', flex: 'none' }}>
            {st.logo ? <img src={st.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} /> : <Store size={28} color="var(--primary)" />}
          </div>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="bold ellipsis" style={{ fontSize: '1.1rem' }}>{s.storeName}</div>
            <div className="small muted ellipsis">{s.address || 'Atur alamat, logo & footer struk'}</div>
          </div>
          <ChevronRight size={20} className="chev" />
        </button>

        <div className="section-title">Toko & Struk</div>
        <div className="list">
          <Item icon={Receipt} color="var(--primary)" bg="var(--primary-soft)" title="Tampilan Struk" sub="Nama toko, logo, header, footer, QR" onClick={set('receiptSettings')} />
          <Item icon={Printer} color="var(--info)" bg="var(--info-soft)" title={isNative ? "Printer Bluetooth" : "Cara Mencetak"} sub={!isNative ? 'AirPrint atau bagikan gambar struk' : pr.state === 'connected' ? `Tersambung: ${pr.name}` : s.printerName ? `Terakhir: ${s.printerName}` : 'Belum diatur'}
            right={<span style={{ width: 10, height: 10, borderRadius: 5, background: pr.state === 'connected' ? 'var(--income)' : 'var(--line)' }} />} onClick={() => nav.push('printer')} />
          <Item icon={Briefcase} color="#8E5BD8" bg="color-mix(in srgb, #8E5BD8 14%, var(--surface))" title="Jenis Usaha" sub={`${bizOf(s.bizType).emoji} ${bizOf(s.bizType).name}${s.trackOrders ? ' · lacak pesanan' : ''}`} onClick={set('cashierSettings')} />
          <Item icon={Calculator} color="#A86A00" bg="var(--accent-soft)" title="Kasir, Pajak & Pembayaran" sub={`Pajak ${s.taxPct}% · Layanan ${s.servicePct}% · ${s.cashier ? 'Kasir ' + s.cashier : 'Nama kasir'}`} onClick={set('cashierSettings')} />
        </div>

        <div className="section-title">Data Usaha</div>
        <div className="list">
          <Item icon={Package} color="var(--info)" bg="var(--info-soft)" title="Produk & Stok" sub={`${st.products.length} produk`} onClick={() => nav.push('products')} />
          <Item icon={Tags} color="#8E5BD8" bg="color-mix(in srgb, #8E5BD8 14%, var(--surface))" title="Kategori Produk" sub={`${st.categories.length} kategori`} onClick={() => nav.push('categories')} />
          <Item icon={Users} color="#1FA3B5" bg="color-mix(in srgb, #1FA3B5 14%, var(--surface))" title="Pelanggan" sub={`${st.customers.length} pelanggan`} onClick={() => nav.push('customers')} />
          {s.trackOrders && <Item icon={ClipboardList} color="var(--info)" bg="var(--info-soft)" title={s.bizType === 'laundry' ? 'Cucian (status & ambil)' : 'Pesanan Berjalan'} sub="Diproses, siap diambil, sudah diambil" onClick={() => nav.push('orders')} />}
          <Item icon={HandCoins} color="#C27C00" bg="var(--accent-soft)" title="Kasbon / Utang Pelanggan" sub={debts.length ? `${debts.length} belum lunas · ${rp(debtTotal)}` : 'Semua lunas'} onClick={() => nav.push('debts')} />
          <Item icon={BarChart3} color="var(--income)" bg="var(--income-soft)" title="Laporan & Laba Rugi" sub="Omzet, laba, produk terlaris, ekspor" onClick={guard('reports', 'Buka Laporan', 'reports')} />
        </div>

        <div className="section-title">Aplikasi</div>
        <div className="list">
          <Item icon={ShieldCheck} color="var(--expense)" bg="var(--expense-soft)" title="Keamanan & PIN" sub={s.pin ? 'PIN aktif' : 'PIN belum dipasang'} onClick={guard(null, 'Masukkan PIN', 'security')} />
          <Item icon={Palette} color="#D9488F" bg="color-mix(in srgb, #D9488F 14%, var(--surface))" title="Tampilan & Suara" sub={`${s.theme === 'dark' ? 'Gelap' : s.theme === 'light' ? 'Terang' : 'Ikut sistem'}${s.bigText ? ' · Tulisan besar' : ''}`} onClick={() => nav.push('appearance')} />
          <Item icon={DatabaseBackup} color="var(--primary)" bg="var(--primary-soft)" title="Cadangkan & Pulihkan Data" sub="Simpan data ke file, pindah HP" onClick={set('backup')} />
          <Item icon={Info} color="var(--muted)" bg="var(--bg2)" title="Tentang & Bantuan" sub="Cara pakai, versi aplikasi" onClick={() => nav.push('about')} />
        </div>
      </div></div>
    </div>
  );
}
