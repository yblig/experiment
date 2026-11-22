import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Crosshair, Info, Layers, Minus, Plus, RotateCcw, Settings2, ShieldCheck, Shrink, Wand2 } from 'lucide-react';
import { StatusBar } from '@capacitor/status-bar';
import { CountRing, PhonePreview, RepeatButton, Slider, Toast, useCountUp } from './components.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Calibrate from './screens/Calibrate.jsx';
import { SettingsSheet, ShizukuSheet } from './screens/Sheets.jsx';
import { ScreenFix, isNative } from './screenfix.js';
import { storage } from './lib/storage.js';
import { native } from './lib/native.js';
import { fx } from './sfx.js';

const CONFIRM_SECS = 15;
const wait = ms => new Promise(r => setTimeout(r, ms));
const pct = (v, w) => ((v / w) * 100).toFixed(1).replace('.', ',');

function Logo() {
  return (
    <div className="logo">
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect x="4" y="1.5" width="16" height="21" rx="4" fill="none" stroke="#47e5b4" strokeWidth="2" />
        <rect x="14" y="3.5" width="4" height="17" rx="1.5" fill="#47e5b4" opacity=".35" />
        <rect x="14.6" y="3.5" width="1.4" height="17" fill="#fff" />
      </svg>
    </div>
  );
}

export default function App() {
  const [st, setSt] = useState(null);
  const [strip, setStrip] = useState(storage.get('strip', 0));
  const [tab, setTab] = useState(storage.get('tab', 'shrink'));
  const [sheet, setSheet] = useState(null);
  const [calib, setCalib] = useState(null);      // { st, restore }
  const [confirm, setConfirm] = useState(null);  // seconds left
  const [busy, setBusy] = useState(false);
  const [onb, setOnb] = useState(!storage.get('onboarded', false));
  const [toastMsg, setToastMsg] = useState(null);
  const toastT = useRef(null);
  const saveT = useRef(null);

  const toast = useCallback(text => {
    clearTimeout(toastT.current);
    setToastMsg({ text, id: Date.now() });
    toastT.current = setTimeout(() => setToastMsg(null), 3400);
  }, []);

  const refresh = useCallback(async () => {
    const s = await ScreenFix.getState();
    setSt(s);
    return s;
  }, []);

  // first load
  useEffect(() => {
    native.toast = () => toast('Tekan kembali sekali lagi untuk keluar');
    refresh().then(s => {
      let v = s.strip || storage.get('strip', 0);
      if (!v) v = Math.round(s.physicalWidth * 0.06);
      setStrip(v);
      if (s.mode === 'overlay' || s.mode === 'shrink') setTab(s.mode);
      native.hideSplash();
    });
    const subs = [
      ScreenFix.addListener('shizukuChanged', () => refresh()),
      ScreenFix.addListener('shrinkReverted', () => { setConfirm(null); fx.back(); toast('Waktu habis, layar dikembalikan seperti semula'); refresh(); })
    ];
    native.onResume(() => refresh());
    let rt;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(refresh, 250); };
    window.addEventListener('resize', onResize);
    return () => { subs.forEach(p => p.then(h => h.remove())); window.removeEventListener('resize', onResize); };
  }, [refresh, toast]);

  // persist width (live-updates the black strip if it is on)
  useEffect(() => {
    if (!st) return;
    storage.set('strip', strip);
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => ScreenFix.setStrip({ strip }).then(setSt), 160);
  }, [strip]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => storage.set('tab', tab), [tab]);

  // confirm countdown
  useEffect(() => {
    if (confirm == null) return;
    if (confirm <= 0) return;
    const t = setTimeout(() => { setConfirm(c => (c == null ? c : c - 1)); if (confirm <= 6) fx.count(); }, 1000);
    return () => clearTimeout(t);
  }, [confirm]);
  useEffect(() => (confirm != null ? native.onBack(() => { revertNow(); return true; }) : undefined), [confirm]); // eslint-disable-line

  const fail = e => {
    fx.error();
    const m = (e && (e.message || e.errorMessage)) || String(e);
    if (/Security|permission|Permission/.test(m)) toast('Ditolak sistem. Nyalakan "Nonaktifkan pemantauan izin" di Opsi pengembang, lalu coba lagi.');
    else toast(m);
  };

  // ---------- shrink ----------
  const applyShrink = async () => {
    if (!st.shizukuGranted) { fx.open(); setSheet('shizuku'); return; }
    fx.tap(); setBusy(true);
    try {
      const s = await ScreenFix.applyShrink({ strip, timeout: CONFIRM_SECS });
      setSt(s);
      fx.open();
      setConfirm(CONFIRM_SECS);
    } catch (e) { fail(e); }
    setBusy(false);
  };
  const keepShrink = async () => {
    setConfirm(null);
    setSt(await ScreenFix.confirmShrink());
    fx.confirm();
    toast('Tersimpan! Tetap begini walau HP restart.');
  };
  const revertNow = async () => {
    setConfirm(null);
    fx.back();
    try { setSt(await ScreenFix.resetShrink({})); toast('Layar kembali normal'); } catch (e) { fail(e); }
  };
  const resetShrink = async () => {
    fx.back(); setBusy(true);
    try { setSt(await ScreenFix.resetShrink({})); toast('Layar kembali normal'); } catch (e) { fail(e); }
    setBusy(false);
  };

  // ---------- overlay ----------
  const startOverlay = async () => {
    if (!st.canDrawOverlays) {
      fx.tap();
      await ScreenFix.requestOverlayPermission();
      toast('Aktifkan "Layar Pas" di daftar itu, lalu kembali ke sini');
      return;
    }
    fx.confirm(); setBusy(true);
    try { setSt(await ScreenFix.startOverlay({ strip })); toast('Tutup hitam menyala di semua aplikasi'); } catch (e) { fail(e); }
    setBusy(false);
  };
  const stopOverlay = async () => {
    fx.back();
    setSt(await ScreenFix.stopOverlay());
  };

  // ---------- calibration ----------
  const openCalib = async () => {
    fx.open(); setBusy(true);
    let s = st;
    const restore = { shrink: s.shrinkActive, overlay: s.overlayRunning };
    try {
      if (s.overlayRunning) s = await ScreenFix.stopOverlay();
      if (s.shrinkActive) { await ScreenFix.resetShrink({ keepMode: true }); await wait(650); }
      s = await refresh();
    } catch (e) { fail(e); setBusy(false); return; }
    try { await StatusBar.hide(); } catch { /* web */ }
    setBusy(false);
    setCalib({ st: s, restore });
  };
  const closeCalib = async (newStrip) => {
    const { restore } = calib;
    setCalib(null);
    try { await StatusBar.show(); } catch { /* web */ }
    const v = newStrip ?? strip;
    if (newStrip != null) setStrip(newStrip);
    try {
      if (restore.shrink) {
        if (newStrip != null && newStrip !== st.appliedStrip) {
          const s = await ScreenFix.applyShrink({ strip: v, timeout: CONFIRM_SECS });
          setSt(s); setConfirm(CONFIRM_SECS);
        } else setSt(await ScreenFix.applyShrink({ strip: v, timeout: 0 }));
      } else if (restore.overlay) {
        setSt(await ScreenFix.startOverlay({ strip: v }));
      } else if (newStrip != null) {
        toast(tab === 'shrink' ? 'Lebar disimpan. Tekan Terapkan untuk mengecilkan layar.' : 'Lebar disimpan. Tekan Nyalakan.');
      }
    } catch (e) { fail(e); }
  };

  const resetAll = async () => {
    setSheet(null); setBusy(true);
    try {
      if (st.overlayRunning) await ScreenFix.stopOverlay();
      if (st.shrinkActive) await ScreenFix.resetShrink({});
      await refresh();
      toast('Semua sudah kembali normal');
    } catch (e) { fail(e); }
    setBusy(false);
  };

  const shownNum = useCountUp(strip, 300);
  if (!st) return <div className="scroll" />;

  if (onb) {
    return <Onboarding onDone={go => { storage.set('onboarded', true); setOnb(false); if (go) setTimeout(openCalib, 250); }} />;
  }

  const Pw = st.physicalWidth;
  const max = Math.round(Pw * 0.35);
  const f = strip / Pw;
  const shrinkOn = st.shrinkActive;
  const overlayOn = st.overlayRunning;
  const anyOn = shrinkOn || overlayOn;
  const changed = shrinkOn && st.appliedStrip !== strip;
  const usable = shrinkOn || tab === 'shrink' ? 100 - 2 * f * 100 : 100 - f * 100;
  const shizukuReady = st.shizukuGranted;
  const shizukuSteps = [st.shizukuInstalled, st.shizukuRunning, st.shizukuGranted].filter(Boolean).length;

  return (
    <>
      <div className="scroll">
        <header className="header">
          <div className="brand">
            <Logo />
            <div>
              <h1>Layar Pas</h1>
              <p>Singkirkan garis di sisi kanan</p>
            </div>
          </div>
          <button className="icon-btn" aria-label="Pengaturan" onClick={() => { fx.open(); setSheet('settings'); }}><Settings2 size={21} /></button>
        </header>

        {/* status + preview */}
        <motion.div className="card preview" layout>
          <PhonePreview f={f} mode={overlayOn ? 'overlay' : shrinkOn ? 'shrink' : tab} active width={112} />
          <div className="preview-info">
            <span className={`status-pill ${anyOn ? 'on' : changed ? 'warn' : ''}`}>
              <span className="dot" />
              {shrinkOn ? 'Layar dikecilkan' : overlayOn ? 'Tutup hitam aktif' : 'Belum aktif'}
            </span>
            <div className="big-num">{Math.round(usable)}<small>%</small></div>
            <div className="sub">
              {tab === 'shrink' || shrinkOn
                ? <>lebar layar yang dipakai. Sisi kanan dan kiri masing-masing <b style={{ color: '#e9eef5' }}>{strip}px</b> hitam.</>
                : <>layar tetap terlihat. Sisi kanan <b style={{ color: '#e9eef5' }}>{strip}px</b> ditutup hitam.</>}
            </div>
          </div>
        </motion.div>

        {/* width */}
        <div className="card">
          <div className="card-title"><Crosshair size={15} /> Lebar sisi kanan</div>
          <div className="width-row">
            <div className="width-val">{Math.round(shownNum)}<small>px · {pct(strip, Pw)}%</small></div>
            <div className="stepper">
              <RepeatButton label="Kurangi" onStep={() => setStrip(v => { const n = Math.max(0, v - 1); fx.tick(0.9); return n; })}><Minus size={20} /></RepeatButton>
              <RepeatButton label="Tambah" onStep={() => setStrip(v => { const n = Math.min(max, v + 1); fx.tick(1.1); return n; })}><Plus size={20} /></RepeatButton>
            </div>
          </div>
          <Slider value={Math.min(strip, max)} max={max} onChange={setStrip} onTick={v => fx.tick(0.9 + (v / max) * 0.6)} />
          <button className="btn outline mt" onClick={openCalib} disabled={busy}><Crosshair size={19} /> Tandai garis di layar</button>
        </div>

        {/* mode */}
        <div className="section-label">Cara memperbaiki</div>
        <div className="modes">
          <button className={`mode ${tab === 'shrink' ? 'sel' : ''}`} onClick={() => { fx.toggle(); setTab('shrink'); }}>
            <span className="badge">TERBAIK</span>
            <div className="m-ico"><Shrink size={21} /></div>
            <b>Kecilkan layar</b>
            <span>Semua isi pindah, tidak ada yang ketimpa garis</span>
          </button>
          <button className={`mode ${tab === 'overlay' ? 'sel' : ''}`} onClick={() => { fx.toggle(); setTab('overlay'); }}>
            <div className="m-ico"><Layers size={21} /></div>
            <b>Tutup hitam</b>
            <span>Tanpa setup, tapi isi di bawahnya ketutup</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'shrink' ? (
            <motion.div key="shrink" className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              {!shizukuReady && (
                <>
                  <div className="card-title"><ShieldCheck size={15} /> Perlu Shizuku · {shizukuSteps}/3</div>
                  {[
                    ['Shizuku terpasang', st.shizukuInstalled],
                    ['Shizuku berjalan', st.shizukuRunning],
                    ['Layar Pas diizinkan', st.shizukuGranted]
                  ].map(([t, ok], i) => (
                    <div key={i} className={`check ${ok ? 'done' : ''}`}>
                      <div className="c-ico">{ok ? <Check size={16} strokeWidth={3} /> : i + 1}</div>
                      <div className="c-txt">{t}</div>
                    </div>
                  ))}
                  <button className="btn primary mt" onClick={() => { fx.open(); setSheet('shizuku'); }}><Wand2 size={19} /> Siapkan sekarang</button>
                </>
              )}
              {shizukuReady && !shrinkOn && (
                <>
                  <div className="note mint" style={{ marginBottom: 12 }}>
                    <Info size={17} />
                    <span>Layar akan mengecil ke tengah. Kalau tidak kamu simpan, <b>layar kembali sendiri dalam {CONFIRM_SECS} detik</b>.</span>
                  </div>
                  <button className="btn primary" disabled={busy || strip < 1} onClick={applyShrink}><Shrink size={19} /> Terapkan</button>
                </>
              )}
              {shizukuReady && shrinkOn && (
                <>
                  {changed && <button className="btn primary" disabled={busy} onClick={applyShrink}><Check size={19} /> Terapkan lebar baru</button>}
                  <button className={`btn ${changed ? 'ghost mt' : 'ghost'}`} disabled={busy} onClick={resetShrink}><RotateCcw size={18} /> Kembalikan normal</button>
                </>
              )}
              {!shizukuReady && shrinkOn && (
                <div className="note mt"><AlertTriangle size={17} /><span>Layar sedang dikecilkan. Jalankan Shizuku lagi untuk mengubah lebar atau mengembalikannya.</span></div>
              )}
            </motion.div>
          ) : (
            <motion.div key="overlay" className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="note" style={{ marginBottom: 12 }}>
                <AlertTriangle size={17} />
                <span>Garis yang rusak di panel <b>tetap menyala</b> walau ditutup hitam. Mode ini hanya menutup isi layar di bawahnya.</span>
              </div>
              {overlayOn
                ? <button className="btn ghost" onClick={stopOverlay}><RotateCcw size={18} /> Matikan tutup hitam</button>
                : <button className="btn primary" disabled={busy || strip < 1} onClick={startOverlay}>
                    <Layers size={19} /> {st.canDrawOverlays ? 'Nyalakan' : 'Beri izin & nyalakan'}
                  </button>}
              {shrinkOn && <p className="sub mt" style={{ textAlign: 'center' }}>Mode kecilkan layar akan dimatikan.</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="note mint">
          <Info size={17} />
          <span>Tambahkan tile <b>Layar Pas</b> di panel notifikasi (ikon pensil) untuk menyalakan atau mematikan perbaikan dengan sekali ketuk, misalnya saat menonton video.</span>
        </div>
        {!isNative && <p className="sub" style={{ textAlign: 'center', marginTop: 14 }}>Pratinjau web</p>}
      </div>

      <ShizukuSheet open={sheet === 'shizuku'} onClose={() => setSheet(null)} st={st} toast={toast} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} st={st}
        onBoot={async v => setSt(await ScreenFix.setOverlayOnBoot({ value: v }))}
        onResetAll={resetAll}
        onReplayIntro={() => { setSheet(null); setOnb(true); }} />

      <AnimatePresence>
        {calib && <Calibrate key="calib" st={calib.st} initial={strip} onSave={v => closeCalib(v)} onCancel={() => closeCalib(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {confirm != null && (
          <>
            <motion.div className="backdrop" style={{ zIndex: 50 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <div className="dialog-wrap">
              <motion.div className="dialog" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
                <CountRing seconds={Math.max(0, confirm)} total={CONFIRM_SECS} />
                <h2>Layarnya sudah pas?</h2>
                <p>Kalau garis putih sudah di luar tampilan, simpan. Kalau tidak dijawab, layar kembali seperti semula.</p>
                <button className="btn primary" onClick={keepShrink}><Check size={20} /> Ya, simpan</button>
                <button className="btn ghost mt" onClick={revertNow}><RotateCcw size={18} /> Kembalikan</button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <Toast msg={toastMsg} />
    </>
  );
}
