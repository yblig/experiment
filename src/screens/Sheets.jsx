import { useState } from 'react';
import { Check, Download, ExternalLink, KeyRound, LifeBuoy, Power, RotateCcw, Sparkles, Vibrate, Volume2, Wrench } from 'lucide-react';
import { Sheet, Switch } from '../components.jsx';
import { ScreenFix } from '../screenfix.js';
import { fx, hapticsOn, setHaptics, setSound, soundOn } from '../sfx.js';

function Step({ n, done, active, title, children }) {
  return (
    <div className={`step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
      <div className="num">{done ? <Check size={18} strokeWidth={3} /> : n}</div>
      <div className="body">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function ShizukuSheet({ open, onClose, st, toast }) {
  const installed = st?.shizukuInstalled, running = st?.shizukuRunning, granted = st?.shizukuGranted;
  const ask = async () => {
    fx.tap();
    try {
      const r = await ScreenFix.requestShizuku();
      if (r.granted) { fx.confirm(); toast('Izin Shizuku diberikan'); onClose(); }
      else if (r.deniedForever) { fx.error(); toast('Izin ditolak permanen. Buka Shizuku → Aplikasi terotorisasi, lalu izinkan Layar Pas.'); }
      else fx.error();
    } catch (e) { fx.error(); toast(e.message || String(e)); }
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <h2>Siapkan Shizuku</h2>
      <p className="lead">Android hanya mengizinkan ukuran layar diubah lewat akses khusus. Shizuku memberikannya tanpa root dan tanpa komputer. Cukup disetup sekali.</p>

      <Step n={1} done={installed} active={!installed} title="Pasang Shizuku">
        <p>Aplikasi gratis dari Play Store.</p>
        {!installed && (
          <button className="btn primary" onClick={() => { fx.tap(); ScreenFix.openShizuku(); }}><Download size={18} /> Buka Play Store</button>
        )}
      </Step>

      <Step n={2} done={running} active={installed && !running} title="Jalankan Shizuku">
        <ol>
          <li>Buka <b>Setelan → Tentang perangkat → Versi</b>, ketuk <b>Nomor build</b> 7 kali.</li>
          <li>Buka <b>Setelan tambahan → Opsi pengembang</b>, nyalakan <b>Wireless debugging</b> (sambung ke Wi-Fi dulu).</li>
          <li>Di Shizuku, ketuk <b>Pairing</b>. Lalu di Wireless debugging pilih <b>Sambungkan dengan kode</b> dan masukkan kodenya lewat notifikasi Shizuku.</li>
          <li>Kembali ke Shizuku, ketuk <b>Start</b>.</li>
        </ol>
        <div className="btn-row">
          <button className="btn ghost" onClick={() => { fx.tap(); ScreenFix.openDeveloperSettings(); }}><Wrench size={17} /> Pengembang</button>
          <button className="btn ghost" disabled={!installed} onClick={() => { fx.tap(); ScreenFix.openShizuku(); }}><ExternalLink size={17} /> Shizuku</button>
        </div>
      </Step>

      <Step n={3} done={granted} active={running && !granted} title="Izinkan Layar Pas">
        <p>Muncul pop-up dari Shizuku. Pilih <b style={{ color: '#e9eef5' }}>Izinkan sepanjang waktu</b>.</p>
        {!granted && <button className="btn primary" disabled={!running} onClick={ask}><KeyRound size={18} /> Minta izin</button>}
      </Step>

      <div className="note mint" style={{ marginTop: 6 }}>
        <Sparkles size={17} />
        <span>Ukuran layar yang sudah diterapkan <b>tetap tersimpan walau HP restart</b>. Shizuku hanya perlu dijalankan lagi kalau kamu mau mengubah lebarnya.</span>
      </div>
      {granted && <button className="btn primary mt" onClick={() => { fx.tap(); onClose(); }}>Selesai</button>}
    </Sheet>
  );
}

export function SettingsSheet({ open, onClose, st, onBoot, onResetAll, onReplayIntro }) {
  const [snd, setSnd] = useState(soundOn());
  const [hap, setHap] = useState(hapticsOn());
  const [help, setHelp] = useState(false);
  return (
    <Sheet open={open} onClose={onClose}>
      <h2>Pengaturan</h2>
      <div className="card" style={{ padding: '4px 16px', marginTop: 14 }}>
        <div className="row-set">
          <div className="rs-ico"><Volume2 size={19} /></div>
          <div className="rs-txt">Suara</div>
          <Switch on={snd} onChange={v => { setSound(v); setSnd(v); fx.toggle(); }} />
        </div>
        <div className="row-set">
          <div className="rs-ico"><Vibrate size={19} /></div>
          <div className="rs-txt">Getar</div>
          <Switch on={hap} onChange={v => { setHaptics(v); setHap(v); fx.toggle(); }} />
        </div>
        <div className="row-set">
          <div className="rs-ico"><Power size={19} /></div>
          <div className="rs-txt">Tutup hitam setelah restart<small>Nyala sendiri saat HP dihidupkan</small></div>
          <Switch on={!!st?.overlayOnBoot} onChange={v => { fx.toggle(); onBoot(v); }} />
        </div>
      </div>

      <div className="card" style={{ padding: '4px 16px' }}>
        <button className="row-set" style={{ width: '100%', textAlign: 'left' }} onClick={() => { fx.tap(); onReplayIntro(); }}>
          <div className="rs-ico"><Sparkles size={19} /></div>
          <div className="rs-txt">Lihat pengenalan lagi</div>
        </button>
        <button className="row-set" style={{ width: '100%', textAlign: 'left' }} onClick={() => { fx.tap(); setHelp(!help); }}>
          <div className="rs-ico"><LifeBuoy size={19} /></div>
          <div className="rs-txt">Kalau tampilan jadi kacau<small>Cara mengembalikan layar ke normal</small></div>
        </button>
        {help && (
          <div className="sub" style={{ padding: '0 2px 14px' }}>
            Setelah menekan Terapkan, layar <b style={{ color: '#e9eef5' }}>kembali sendiri dalam 15 detik</b> kalau kamu tidak menekan "Ya, simpan".
            Kalau sudah tersimpan dan ingin kembali normal: buka Layar Pas, lalu <b style={{ color: '#e9eef5' }}>Kembalikan normal</b>, atau pakai tile <b style={{ color: '#e9eef5' }}>Layar Pas</b> di panel notifikasi.
            Dari komputer, jalankan perintah ini:
            <code className="cmd">adb shell wm size reset</code>
          </div>
        )}
      </div>

      <button className="btn danger" onClick={() => { fx.back(); onResetAll(); }}><RotateCcw size={18} /> Kembalikan semua ke normal</button>
      <p className="sub" style={{ textAlign: 'center', marginTop: 16 }}>
        Layar Pas 1.0 · {st?.manufacturer} {st?.model} · Android {st?.release}<br />
        Panel {st?.physicalWidth}×{st?.physicalHeight}px
      </p>
    </Sheet>
  );
}
