import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, GripVertical, X } from 'lucide-react';
import { RepeatButton } from '../components.jsx';
import { cssToPhysical, physicalToCss } from '../screenfix.js';
import { native } from '../lib/native.js';
import { fx } from '../sfx.js';

export default function Calibrate({ st, initial, onSave, onCancel }) {
  const Pw = st.physicalWidth;
  const max = Math.round(Pw * 0.4);
  const [strip, setStrip] = useState(Math.min(max, Math.max(1, initial || Math.round(Pw * 0.08))));
  const [vw, setVw] = useState(window.innerWidth);
  const dragging = useRef(false);
  const lastTick = useRef(strip);

  useEffect(() => {
    const r = () => setVw(window.innerWidth);
    window.addEventListener('resize', r);
    const off = native.onBack(() => { onCancel(); return true; });
    return () => { window.removeEventListener('resize', r); off(); };
  }, [onCancel]);

  const x = physicalToCss(Pw - strip, st, vw);
  const setFromX = cx => {
    const px = cssToPhysical(cx, st, vw);
    const v = Math.round(Math.max(1, Math.min(max, Pw - px)));
    setStrip(v);
    if (Math.abs(v - lastTick.current) >= 6) { fx.tick(1 + (v / max) * 0.5); lastTick.current = v; }
  };
  const nudge = d => setStrip(s => { const v = Math.max(1, Math.min(max, s + d)); fx.tick(1.2); return v; });

  return (
    <motion.div className="calib" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onPointerDown={e => { if (e.target.closest('.panel')) return; dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); setFromX(e.clientX); }}
      onPointerMove={e => { if (dragging.current) setFromX(e.clientX); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}>
      <div className="cut" style={{ left: x }} />
      <div className="marker" style={{ left: x }} />
      <motion.div className="handle" style={{ left: x }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
        <GripVertical size={26} />
      </motion.div>

      <div className="panel" style={{ top: 'calc(var(--safe-t) + 14px)' }}>
        <h2>Tandai garis putih</h2>
        <p>Seret penanda merah sampai <b style={{ color: '#e9eef5' }}>tepat di kiri garis putih</b>. Bagian berarsir akan jadi hitam kosong.</p>
      </div>

      <div className="panel" style={{ bottom: 'calc(var(--safe-b) + 14px)' }}>
        <div className="readout">
          <RepeatButton label="Geser kiri" onStep={() => nudge(1)}><ChevronLeft size={22} /></RepeatButton>
          <div className="v" style={{ textAlign: 'center' }}>
            {strip}<small>px · {((strip / Pw) * 100).toFixed(1).replace('.', ',')}%</small>
          </div>
          <RepeatButton label="Geser kanan" onStep={() => nudge(-1)}><ChevronRight size={22} /></RepeatButton>
        </div>
        <div className="btn-row mt">
          <button className="btn ghost" onClick={() => { fx.back(); onCancel(); }}><X size={19} /> Batal</button>
          <button className="btn primary" onClick={() => { fx.confirm(); onSave(strip); }}><Check size={20} /> Simpan</button>
        </div>
      </div>
    </motion.div>
  );
}
