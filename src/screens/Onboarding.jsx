import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PhonePreview } from '../components.jsx';
import { fx } from '../sfx.js';

const SLIDES = [
  {
    title: 'Garis putih di layar\nbikin terganggu?',
    text: 'Garis itu rusak di panelnya, jadi tetap menyala walau layar hitam. Solusinya: jauhkan isi layar dari garis itu.',
    art: { f: 0.1, mode: 'off', active: false }
  },
  {
    title: 'Kecilkan seluruh\ntampilan HP',
    text: 'Semua aplikasi dipindah ke area yang masih bagus. Sisi kanan jadi hitam kosong, lebarnya bisa kamu atur sendiri.',
    art: { f: 0.13, mode: 'shrink', active: true }
  },
  {
    title: 'Tandai garisnya,\nselesai',
    text: 'Geser penanda merah sampai menempel di sebelah kiri garis putih. Layar Pas langsung menghitung lebarnya.',
    art: { f: 0.13, mode: 'off', active: false, marker: true }
  }
];

export default function Onboarding({ onDone }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const next = () => {
    if (i < SLIDES.length - 1) { fx.tap(); setI(i + 1); } else { fx.confirm(); onDone(true); }
  };
  return (
    <div className="onb">
      <button className="skip" onClick={() => { fx.back(); onDone(false); }}>Lewati</button>
      <div className="art">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }} transition={{ duration: 0.35, ease: [0.2, 0.9, 0.25, 1] }}>
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <PhonePreview {...s.art} width={150} />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="dots">{SLIDES.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
          <h1 style={{ whiteSpace: 'pre-line' }}>{s.title}</h1>
          <p>{s.text}</p>
        </motion.div>
      </AnimatePresence>
      <button className="btn primary" onClick={next}>
        {i < SLIDES.length - 1 ? 'Lanjut' : 'Tandai garis sekarang'} <ArrowRight size={20} />
      </button>
    </div>
  );
}
