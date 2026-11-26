import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bluetooth, BluetoothOff, RefreshCw, Printer as PrinterIcon, Settings2, Check, Loader2, Unplug, ShieldAlert, Info } from 'lucide-react';
import { useStore } from '../store.js';
import { toast } from '../ui.js';
import { fx } from '../lib/fx.js';
import { native } from '../lib/native.js';
import { usePrinter, status, listDevices, connect, disconnect, forget, requestAccess, enableBluetooth, openBtSettings, printBlocks, isNative, errText } from '../lib/printer.js';
import { buildTestReceipt } from '../lib/receipt.js';
import { Page, Toggle, Seg } from '../components/ui.jsx';
import { ArtPrinter } from '../components/art.jsx';

let resumeRef = null;
native.onResume(() => resumeRef?.());

function WebPrinterInfo({ test }) {
  const s = useStore(st => st.settings); const set = useStore(st => st.setSettings);
  const steps = [
    ['AirPrint (printer Wi-Fi)', 'Tekan Cetak di struk → pilih “Cetak (AirPrint)” → pilih printer Anda. Cocok untuk printer Wi-Fi yang mendukung AirPrint.'],
    ['Printer thermal Bluetooth', 'Tekan Cetak → “Bagikan gambar” → pilih aplikasi bawaan printer Anda (yang biasanya ada di kardus/manual printer) untuk mencetak gambar struk.'],
    ['Kirim ke pelanggan', 'Tekan Cetak → “Bagikan gambar” → WhatsApp. Pelanggan menerima struk digital tanpa kertas.']
  ];
  return (
    <Page title="Cara Mencetak" sub="Versi iPhone / iPad / browser">
      <div className="card" style={{ textAlign: 'center', paddingTop: 8 }}>
        <ArtPrinter size={130} />
        <div className="bold" style={{ fontSize: '1.1rem' }}>Cetak lewat AirPrint atau bagikan gambar</div>
        <div className="small muted mt8" style={{ lineHeight: 1.5 }}>Safari di iPhone/iPad tidak mengizinkan aplikasi web menyambung langsung ke printer Bluetooth. Untuk sambungan Bluetooth langsung, pakai aplikasi Android StrukKu.</div>
        <button className="btn primary block mt16" onClick={test}><PrinterIcon size={20} /> Coba cetak struk tes</button>
      </div>
      <div className="section-title">Pilihan mencetak</div>
      <div className="card">
        {steps.map(([t, d], i) => (
          <div key={i} className="row" style={{ alignItems: 'flex-start', gap: 12, marginBottom: i < steps.length - 1 ? 14 : 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--primary)', color: 'var(--on-primary)', display: 'grid', placeItems: 'center', fontWeight: 800, flex: 'none' }}>{i + 1}</div>
            <div><div className="bold">{t}</div><div className="small muted" style={{ lineHeight: 1.45 }}>{d}</div></div>
          </div>
        ))}
      </div>
      <div className="section-title">Ukuran struk</div>
      <div className="card"><Seg value={s.paper} onChange={v => set({ paper: v })} options={[{ value: 58, label: '58 mm' }, { value: 80, label: '80 mm' }]} /></div>
    </Page>
  );
}

export default function Printer() {
  const p = usePrinter(); const s = useStore(st => st.settings); const set = useStore(st => st.setSettings); const logo = useStore(st => st.logo);
  const [bt, setBt] = useState(null);
  const [devices, setDevices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const st = await status(); setBt(st);
      if (st.connected) usePrinter.setState({ state: 'connected', name: st.name || usePrinter.getState().name, address: st.address });
      else if (usePrinter.getState().state === 'connected') usePrinter.setState({ state: 'idle' });
      if (st.supported && st.enabled && st.granted) setDevices(await listDevices()); else setDevices(null);
    } catch (e) { setErr(errText(e)); }
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); resumeRef = refresh; return () => { resumeRef = null; }; }, []);

  const doConnect = async d => {
    fx('tap');
    try { await connect(d.address, d.name); fx('success'); toast(`Tersambung ke ${d.name}`); }
    catch (e) { fx('error'); toast(errText(e), { type: 'error', duration: 4500 }); }
  };
  const test = async () => {
    try { if (await printBlocks(buildTestReceipt(s, { hasLogo: !!logo }), { name: 'tes-struk' }) === 'web') return; fx('print'); toast('Tes cetak berhasil dikirim'); }
    catch (e) { fx('error'); toast(e.message, { type: 'error' }); }
  };
  const grant = async () => { const r = await requestAccess().catch(() => ({ granted: false })); if (!r.granted) toast('Izin ditolak. Buka Pengaturan HP → Aplikasi → StrukKu → Izin → Perangkat di sekitar.', { type: 'error', duration: 6000 }); refresh(); };
  const connected = p.state === 'connected';
  if (!isNative) return <WebPrinterInfo test={test} />;

  return (
    <Page title="Printer Bluetooth" sub={connected ? `Tersambung ke ${p.name}` : 'Sambungkan printer struk thermal'}
      right={<button className="icon-btn solid" onClick={() => { fx('tap'); refresh(); }} aria-label="Muat ulang"><RefreshCw size={21} className={loading ? 'spin' : ''} /></button>}>
      <motion.div layout className="card" style={{ textAlign: 'center', paddingTop: 8 }}>
        <ArtPrinter size={130} />
        <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: connected ? 'var(--income)' : p.state === 'connecting' ? 'var(--accent)' : 'var(--line)' }} className={p.state === 'connecting' ? 'pulse' : ''} />
          <span className="bold" style={{ fontSize: '1.1rem' }}>{connected ? p.name : p.state === 'connecting' ? `Menyambung ke ${p.name}…` : s.printerName ? `${s.printerName} (tidak tersambung)` : 'Belum ada printer'}</span>
        </div>
        {p.error && p.state === 'error' && <div className="small red mt8">{p.error}</div>}
        {!isNative && <div className="tiny muted mt8">Mode demo di browser — di HP Android printer asli akan muncul.</div>}
        <div className="row gap8 mt16">
          {connected ? <>
            <button className="btn outline" onClick={async () => { await disconnect(); fx('toggle'); }}><Unplug size={19} /> Putuskan</button>
            <button className="btn primary grow" disabled={p.busy} onClick={test}>{p.busy ? <Loader2 size={20} className="spin" /> : <PrinterIcon size={20} />} Tes cetak</button>
          </> : s.printerAddress ? <>
            <button className="btn outline" onClick={async () => { await forget(); fx('remove'); }}>Lupakan</button>
            <button className="btn primary grow" disabled={p.state === 'connecting'} onClick={() => doConnect({ address: s.printerAddress, name: s.printerName })}>{p.state === 'connecting' ? <Loader2 size={20} className="spin" /> : <Bluetooth size={20} />} Sambungkan lagi</button>
          </> : null}
        </div>
      </motion.div>

      {bt && !bt.supported && <div className="card mt12 row"><BluetoothOff size={24} color="var(--expense)" /><div className="grow bold">HP ini tidak memiliki Bluetooth</div></div>}
      {bt && bt.supported && !bt.granted && (
        <div className="card mt12" style={{ background: 'var(--accent-soft)', boxShadow: 'none' }}>
          <div className="row"><ShieldAlert size={24} color="#C27C00" /><div className="grow"><div className="bold">Izinkan akses Bluetooth</div><div className="small muted">StrukKu perlu izin “Perangkat di sekitar” untuk menemukan printer.</div></div></div>
          <button className="btn accent block mt12" onClick={grant}>Izinkan</button>
        </div>
      )}
      {bt && bt.supported && bt.granted && !bt.enabled && (
        <div className="card mt12" style={{ background: 'var(--info-soft)', boxShadow: 'none' }}>
          <div className="row"><BluetoothOff size={24} color="var(--info)" /><div className="grow"><div className="bold">Bluetooth masih mati</div><div className="small muted">Nyalakan Bluetooth untuk menyambung ke printer.</div></div></div>
          <button className="btn primary block mt12" onClick={async () => { await enableBluetooth().catch(e => toast(errText(e), { type: 'error' })); setTimeout(refresh, 2500); }}><Bluetooth size={20} /> Nyalakan Bluetooth</button>
        </div>
      )}
      {err && <div className="card mt12 small red">{err}</div>}

      {devices && <>
        <div className="section-title">Perangkat yang sudah dipasangkan</div>
        {devices.length === 0 ? <div className="card muted small" style={{ textAlign: 'center' }}>Belum ada perangkat. Pasangkan printer dulu lewat Pengaturan Bluetooth (lihat langkah di bawah).</div> : (
          <div className="list">
            {devices.map(d => {
              const isCur = connected && p.address === d.address;
              const isConn = p.state === 'connecting' && p.address === d.address;
              return (
                <div key={d.address} className="li">
                  <div className="ic" style={{ background: d.printer ? 'var(--primary-soft)' : 'var(--bg2)', color: d.printer ? 'var(--primary)' : 'var(--muted)' }}>{d.printer ? <PrinterIcon size={21} /> : <Bluetooth size={21} />}</div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="t ellipsis">{d.name}</div>
                    <div className="s">{d.address}{d.printer ? ' · kemungkinan printer' : ''}</div>
                  </div>
                  {isCur ? <span className="tag green"><Check size={14} /> Tersambung</span>
                    : <button className={'btn sm ' + (d.printer ? 'primary' : 'outline')} disabled={p.state === 'connecting'} onClick={() => doConnect(d)}>{isConn ? <Loader2 size={18} className="spin" /> : 'Sambungkan'}</button>}
                </div>
              );
            })}
          </div>
        )}
      </>}

      <div className="section-title">Printer tidak ada di daftar?</div>
      <div className="card">
        {[['Nyalakan printer', 'Tekan lama tombol power sampai lampu menyala.'], ['Pasangkan di Pengaturan HP', 'Buka Pengaturan Bluetooth, pilih printer (misal RPP02N, MTP-II, BlueTooth Printer). Jika diminta PIN, coba 0000 atau 1234.'], ['Kembali ke sini', 'Tekan tombol muat ulang ↻ lalu pilih Sambungkan.']].map(([t, d], i) => (
          <div key={i} className="row" style={{ alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--primary)', color: 'var(--on-primary)', display: 'grid', placeItems: 'center', fontWeight: 800, flex: 'none' }}>{i + 1}</div>
            <div><div className="bold">{t}</div><div className="small muted">{d}</div></div>
          </div>
        ))}
        <button className="btn soft block" onClick={() => openBtSettings()}><Settings2 size={20} /> Buka Pengaturan Bluetooth</button>
      </div>

      <div className="section-title">Pengaturan printer</div>
      <div className="card">
        <div className="field"><label>Ukuran kertas</label><Seg value={s.paper} onChange={v => set({ paper: v })} options={[{ value: 58, label: '58 mm' }, { value: 80, label: '80 mm' }]} /></div>
        <div className="row" style={{ padding: '6px 0' }}><div className="grow"><div className="bold">Sambung otomatis</div><div className="tiny muted">Langsung tersambung saat aplikasi dibuka</div></div><Toggle on={s.autoConnect} onChange={v => set({ autoConnect: v })} /></div>
        <div className="row" style={{ padding: '6px 0' }}><div className="grow"><div className="bold">Cetak otomatis setelah bayar</div></div><Toggle on={s.autoPrint} onChange={v => set({ autoPrint: v })} /></div>
      </div>
      <div className="row small muted mt16" style={{ gap: 8, alignItems: 'flex-start' }}><Info size={16} style={{ flex: 'none', marginTop: 2 }} />Mendukung printer thermal Bluetooth ESC/POS 58 mm & 80 mm (RPP02N, Panda, Eppos, Xprinter, MTP, iWare, dll). Printer khusus BLE saja belum didukung.</div>
    </Page>
  );
}
