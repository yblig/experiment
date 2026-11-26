import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Wallet, BarChart3, ShieldCheck, ArrowRight, Sparkles, PackageOpen, Check } from 'lucide-react';
import { useStore } from '../store.js';
import { fx } from '../lib/fx.js';
import { Field, Seg } from '../components/ui.jsx';
import { ArtShop, ArtBox } from '../components/art.jsx';

export default function Onboarding() {
  const s = useStore(st => st.settings); const set = useStore(st => st.setSettings);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(s.storeName === 'Toko Saya' ? '' : s.storeName);
  const next = () => { fx('tap'); setStep(x => x + 1); };
  const finish = sample => {
    if (sample) useStore.getState().loadSample();
    set({ onboarded: true }); fx('success');
  };
  const feats = [
    [Printer, 'Cetak struk lewat Bluetooth', 'Printer thermal 58 & 80 mm'],
    [Wallet, 'Catat uang masuk & keluar', 'Penjualan tercatat otomatis'],
    [BarChart3, 'Laporan laba langsung jadi', 'Harian, mingguan, bulanan'],
    [ShieldCheck, 'Keuangan dikunci PIN', 'Hanya Anda yang bisa melihat']
  ];
  return (
    <div className="page" style={{ paddingTop: 'calc(var(--safe-top) + 12px)' }}>
      <div className="row" style={{ justifyContent: 'center', gap: 6, padding: '10px 0' }}>
        {[0, 1, 2].map(i => <motion.div key={i} animate={{ width: step === i ? 26 : 8, background: step >= i ? 'var(--primary)' : 'var(--line)' }} style={{ height: 8, borderRadius: 4 }} />)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }} className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
          {step === 0 && (
            <div className="pad col" style={{ flex: 1 }}>
              <div style={{ textAlign: 'center', marginTop: 8 }}><ArtShop size={170} /></div>
              <h1 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 6px', letterSpacing: '-.02em' }}>Selamat datang di StrukKu</h1>
              <p className="muted" style={{ textAlign: 'center', margin: '0 0 18px', lineHeight: 1.5 }}>Kasir dan pembukuan usaha dalam satu aplikasi.</p>
              <div className="col gap8">
                {feats.map(([Icon, t, d], i) => (
                  <motion.div key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="card row" style={{ padding: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon size={22} /></div>
                    <div><div className="bold">{t}</div><div className="small muted">{d}</div></div>
                  </motion.div>
                ))}
              </div>
              <div style={{ flex: 1, minHeight: 20 }} />
              <button className="btn primary lg block" style={{ marginBottom: 'calc(var(--safe-bottom) + 18px)', marginTop: 16 }} onClick={next}>Mulai <ArrowRight size={21} /></button>
            </div>
          )}
          {step === 1 && (
            <div className="pad col" style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '12px 0 4px' }}>Data toko Anda</h1>
              <p className="muted" style={{ marginTop: 0 }}>Akan tercetak di bagian atas struk. Bisa diubah kapan saja.</p>
              <div className="card">
                <Field label="Nama toko / usaha"><input className="input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Warung Bu Ani" /></Field>
                <Field label="Alamat (opsional)"><input className="input" value={s.address} onChange={e => set({ address: e.target.value })} placeholder="Jl. Melati No. 5" /></Field>
                <Field label="No. HP / WA (opsional)"><input className="input" inputMode="tel" value={s.phone} onChange={e => set({ phone: e.target.value })} placeholder="08xxxxxxxxxx" /></Field>
                <Field label="Ukuran kertas printer" hint="Tidak tahu? Kebanyakan printer kecil memakai 58 mm"><Seg value={s.paper} onChange={v => set({ paper: v })} options={[{ value: 58, label: '58 mm' }, { value: 80, label: '80 mm' }]} /></Field>
              </div>
              <div style={{ flex: 1, minHeight: 20 }} />
              <button className="btn primary lg block" style={{ marginBottom: 'calc(var(--safe-bottom) + 18px)', marginTop: 16 }} disabled={!name.trim()} onClick={() => { set({ storeName: name.trim() }); next(); }}>Lanjut <ArrowRight size={21} /></button>
            </div>
          )}
          {step === 2 && (
            <div className="pad col" style={{ flex: 1 }}>
              <div style={{ textAlign: 'center', marginTop: 12 }}><ArtBox size={160} /></div>
              <h1 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, margin: '8px 0 6px' }}>Daftar barang</h1>
              <p className="muted" style={{ textAlign: 'center', marginTop: 0, lineHeight: 1.5 }}>Mau langsung mencoba dengan contoh produk warung (nasi goreng, es teh, dll)? Contoh bisa diubah atau dihapus nanti.</p>
              <div style={{ flex: 1, minHeight: 20 }} />
              <div className="col gap8" style={{ marginBottom: 'calc(var(--safe-bottom) + 18px)' }}>
                <button className="btn primary lg block" onClick={() => finish(true)}><Sparkles size={21} /> Pakai contoh produk</button>
                <button className="btn outline lg block" onClick={() => finish(false)}><PackageOpen size={21} /> Mulai dari kosong</button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
