// First-run welcome: language, what the app does, how to make a video.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Send, Clapperboard, ChevronRight } from 'lucide-react';
import { useStore } from '../store.js';
import { BrandMark, Seg } from '../components/ui.jsx';
import { LANGS } from '../i18n.js';
import { fx } from '../fx.js';

const STEPS = [
  { I: null, t: 'Selamat datang di ChatSim', d: 'Bikin screenshot dan video chat buat cerita, konten TikTok, komik, dan meme. Semua dibuat offline di HP kamu.' },
  { I: LayoutGrid, t: 'Pilih aplikasinya', d: 'Ada 12 gaya: WhatsApp, iMessage, Telegram, Instagram, LINE, Messenger, Snapchat, Tinder, KakaoTalk, X, SMS, dan Layar Kunci. Bisa diganti kapan saja.' },
  { I: Send, t: 'Tulis percakapannya', d: 'Ketik pesan sebagai Aku atau Dia, ketuk gelembung untuk mengedit. Ada foto, voice note, polling, reaksi, balasan, grup, dan banyak lagi.' },
  { I: Clapperboard, t: 'Simpan jadi gambar atau video', d: 'Tombol simpan untuk PNG, tombol Video untuk MP4 dengan animasi mengetik, suara notifikasi, dan musik.' }
];

export default function Onboarding() {
  const { settings, setSettings } = useStore();
  const [i, setI] = useState(0);
  if (settings.onboarded) return null;
  const st = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <motion.div className="onb" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence mode="wait">
        <motion.div key={i} className="onb-card" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}>
          <div className="onb-art">{st.I ? <st.I size={54} strokeWidth={1.8} /> : <BrandMark size={84} />}</div>
          <h2>{st.t}</h2>
          <p>{st.d}</p>
          {i === 0 && (
            <div style={{ width: '100%', marginTop: 8 }}>
              <Seg value={settings.lang || 'id'} onChange={v => setSettings({ lang: v })} options={LANGS} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="onb-dots">{STEPS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      <div className="onb-btns">
        <button className="btn ghost press" onClick={() => { fx.tap(); setSettings({ onboarded: true }); }}>Lewati</button>
        <button className="btn primary press" style={{ flex: 1 }} onClick={() => { fx.tap(); last ? setSettings({ onboarded: true }) : setI(i + 1); }}>
          {last ? 'Mulai bikin' : 'Lanjut'} <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
