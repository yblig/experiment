import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { X } from 'lucide-react';
import { native } from '../lib/native.js';
import { fx } from '../fx.js';

export function useBack(active, fn) {
  useEffect(() => {
    if (!active) return;
    return native.onBack(() => { fn(); return true; });
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function Sheet({ open, onClose, title, children }) {
  useBack(open, onClose);
  useEffect(() => { if (open) fx.open(); }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div key="sh" className="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 600) onClose(); }}>
            <div className="sheet-grab" />
            {title && (
              <div className="sheet-head">
                <h3>{title}</h3>
                <button className="icon-btn tinted press" onClick={() => { fx.tap(); onClose(); }} aria-label="Tutup"><X size={20} /></button>
              </div>
            )}
            <div className="sheet-body" onPointerDown={e => e.stopPropagation()}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Switch({ on, onChange }) {
  return <button className={'switch press' + (on ? ' on' : '')} onClick={() => { fx.toggle(); onChange(!on); }} aria-pressed={on} />;
}

export function Seg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <button key={v} className={value === v ? 'on' : ''} onClick={() => { fx.tap(); onChange(v); }}>{l}</button>
      ))}
    </div>
  );
}

const useToastStore = create(set => ({ t: null, show: t => set({ t: { ...t, k: Date.now() } }), hide: () => set({ t: null }) }));
export const toast = (msg, action) => useToastStore.getState().show({ msg, action });

export function ToastHost() {
  const { t, hide } = useToastStore();
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(hide, t.action ? 4200 : 2600);
    return () => clearTimeout(id);
  }, [t, hide]);
  return (
    <AnimatePresence>
      {t && (
        <motion.div key={t.k} className="toast" initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 12, x: '-50%' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.msg}</span>
          {t.action && <button onClick={() => { t.action.fn(); hide(); }}>{t.action.label}</button>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function BrandMark({ size = 38 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id="bm1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a99dff" /><stop offset="1" stopColor="#5d4be6" /></linearGradient>
        <linearGradient id="bm2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5ff0c4" /><stop offset="1" stopColor="#1fb68a" /></linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#bm1)" />
      <path d="M13 18c0-3 2.4-5.4 5.4-5.4h18.2c3 0 5.4 2.4 5.4 5.4v8.6c0 3-2.4 5.4-5.4 5.4H24l-6.6 5.2c-.8.6-1.9 0-1.9-1v-4.4A5.4 5.4 0 0 1 13 26.6z" fill="#fff" />
      <path d="M51 34.4c0-3-2.4-5.4-5.4-5.4H30.8c-3 0-5.4 2.4-5.4 5.4v8c0 3 2.4 5.4 5.4 5.4h10.4l6 4.8c.8.6 1.9 0 1.9-1v-4A5.4 5.4 0 0 0 51 42.4z" fill="url(#bm2)" stroke="#fff" strokeWidth="2.4" />
      <circle cx="21" cy="22.4" r="2.2" fill="#6c5cff" /><circle cx="27.6" cy="22.4" r="2.2" fill="#6c5cff" /><circle cx="34.2" cy="22.4" r="2.2" fill="#6c5cff" />
    </svg>
  );
}

// Scales a 390-wide Shot down to `width` for thumbnails.
export function Mini({ width, children }) {
  const s = width / 390;
  return <div style={{ transform: `scale(${s})`, width: 390 }}>{children}</div>;
}

export function useNow(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => { const id = setInterval(() => set(x => x + 1), ms); return () => clearInterval(id); }, [ms]);
}
