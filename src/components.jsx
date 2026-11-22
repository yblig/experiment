import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { native } from './lib/native.js';

/* Phone mock-up that shows what the fix does to the screen. f = strip / panel width. */
export function PhonePreview({ f = 0.08, mode = 'shrink', active = true, marker = false, width = 118 }) {
  const X0 = 9, W = 102, Y0 = 12, H = 226;
  const shrink = mode === 'shrink' && active;
  const cover = mode === 'overlay' && active;
  const strip = useTween(W * f);
  const sx = useTween(shrink ? (W - 2 * W * f) / W : 1);
  const tx = useTween(shrink ? X0 + W * f : X0);
  const coverW = useTween(cover ? W * f : 0);
  const lineX = X0 + W - strip * 0.45;
  return (
    <svg viewBox="0 0 120 250" width={width} height={width * 250 / 120} style={{ flex: 'none', overflow: 'visible' }}>
      <defs>
        <linearGradient id="pp-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a4658" /><stop offset=".5" stopColor="#202a37" /><stop offset="1" stopColor="#151c26" />
        </linearGradient>
        <linearGradient id="pp-hero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#47e5b4" /><stop offset="1" stopColor="#3d7bff" />
        </linearGradient>
        <linearGradient id="pp-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".09" /><stop offset=".45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="pp-screen"><rect x={X0} y={Y0} width={W} height={H} rx="11" /></clipPath>
        <filter id="pp-glow" x="-200%" y="-10%" width="500%" height="120%"><feGaussianBlur stdDeviation="1.4" /></filter>
      </defs>
      <ellipse cx="60" cy="246" rx="46" ry="5" fill="#000" opacity=".45" />
      <rect x="3" y="2" width="114" height="244" rx="17" fill="url(#pp-body)" />
      <rect x="3.6" y="2.6" width="112.8" height="242.8" rx="16.4" fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth=".8" />
      <rect x="117" y="58" width="2" height="22" rx="1" fill="#2a3442" />
      <g clipPath="url(#pp-screen)">
        <rect x={X0} y={Y0} width={W} height={H} fill="#000" />
        <g transform={`translate(${tx} 0) scale(${sx} 1)`}>
          <rect x="0" y={Y0} width={W} height={H} fill="#1a2331" />
          {/* status bar */}
          <rect x="7" y={Y0 + 6} width="16" height="3" rx="1.5" fill="#8c99ab" />
          <rect x={W - 22} y={Y0 + 6} width="15" height="3" rx="1.5" fill="#8c99ab" />
          {/* header */}
          <circle cx="13" cy={Y0 + 22} r="6" fill="#ffb547" />
          <rect x="23" y={Y0 + 18} width="38" height="4" rx="2" fill="#e9eef5" />
          <rect x="23" y={Y0 + 25} width="24" height="3" rx="1.5" fill="#5d6a7c" />
          {/* hero card */}
          <rect x="7" y={Y0 + 36} width={W - 14} height="58" rx="8" fill="url(#pp-hero)" />
          <circle cx={W - 24} cy={Y0 + 56} r="12" fill="#fff" opacity=".25" />
          <rect x="14" y={Y0 + 74} width="40" height="5" rx="2.5" fill="#fff" opacity=".9" />
          <rect x="14" y={Y0 + 83} width="26" height="3.5" rx="1.75" fill="#fff" opacity=".6" />
          {/* list rows */}
          {[0, 1, 2, 3].map(i => (
            <g key={i} transform={`translate(0 ${Y0 + 104 + i * 26})`}>
              <rect x="7" y="0" width="18" height="18" rx="6" fill={['#3d7bff', '#ff5e6c', '#47e5b4', '#b07cff'][i]} opacity=".85" />
              <rect x="31" y="3" width={44 - i * 5} height="4" rx="2" fill="#e9eef5" opacity=".9" />
              <rect x="31" y="11" width={30 + i * 4} height="3" rx="1.5" fill="#5d6a7c" />
              <rect x={W - 20} y="5" width="13" height="7" rx="3.5" fill="#263142" />
            </g>
          ))}
          {/* nav bar */}
          <rect x={W / 2 - 16} y={Y0 + H - 8} width="32" height="3" rx="1.5" fill="#8c99ab" />
        </g>
        {coverW > 0.05 && <rect x={X0 + W - coverW} y={Y0} width={coverW} height={H} fill="#000" />}
        {/* the broken line: always lit */}
        <rect x={lineX - 1.4} y={Y0} width="2.8" height={H} fill="#fff" filter="url(#pp-glow)" opacity=".9" />
        <rect x={lineX - 0.7} y={Y0} width="1.4" height={H} fill="#fff" />
        {marker && (
          <g>
            <rect x={X0 + W - strip} y={Y0} width={strip} height={H} fill="#ff5e6c" opacity=".14" />
            <rect x={X0 + W - strip - 0.8} y={Y0} width="1.6" height={H} fill="#ff5e6c" />
            <rect x={X0 + W - strip - 7} y={Y0 + H / 2 - 12} width="14" height="24" rx="5" fill="#ff5e6c" />
            <rect x={X0 + W - strip - 2.2} y={Y0 + H / 2 - 6} width="1.2" height="12" rx=".6" fill="#fff" opacity=".8" />
            <rect x={X0 + W - strip + 1} y={Y0 + H / 2 - 6} width="1.2" height="12" rx=".6" fill="#fff" opacity=".8" />
          </g>
        )}
        <rect x={X0} y={Y0} width={W} height={H} fill="url(#pp-glass)" />
      </g>
      <circle cx="60" cy={Y0 + 7} r="2.6" fill="#05070a" />
    </svg>
  );
}

/* Eases a number towards its target (for SVG attributes, which CSS can't animate). */
export function useTween(target, ms = 520) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    const a = cur.current, start = performance.now();
    if (a === target) return;
    let raf;
    const step = now => {
      const k = Math.min(1, (now - start) / ms), e = 1 - Math.pow(1 - k, 4);
      cur.current = a + (target - a) * e;
      setV(cur.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function Slider({ value, max, onChange, onTick }) {
  const ref = useRef(null);
  const last = useRef(value);
  const set = clientX => {
    const r = ref.current.getBoundingClientRect();
    const v = Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * max);
    if (v !== last.current) {
      if (Math.abs(v - last.current) >= Math.max(1, Math.round(max / 60)) || v === 0 || v === max) onTick?.(v);
      last.current = v;
      onChange(v);
    }
  };
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div className="slider" ref={ref}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); set(e.clientX); }}
      onPointerMove={e => { if (e.buttons || e.pointerType === 'touch') { if (e.currentTarget.hasPointerCapture(e.pointerId)) set(e.clientX); } }}>
      <div className="track"><div className="fill" style={{ left: 0, right: 'auto', width: `${pct}%` }} /></div>
      <div className="thumb" style={{ left: `${pct}%` }} />
    </div>
  );
}

/* Button that repeats while held, for 1-px fine tuning. */
export function RepeatButton({ onStep, children, className = 'step-btn', label }) {
  const t = useRef(null);
  const stop = () => { clearTimeout(t.current); clearInterval(t.current); t.current = null; };
  useEffect(() => stop, []);
  return (
    <button className={className} aria-label={label}
      onPointerDown={() => { onStep(); t.current = setTimeout(() => { t.current = setInterval(onStep, 55); }, 380); }}
      onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}>
      {children}
    </button>
  );
}

export function Switch({ on, onChange }) {
  return <button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)} />;
}

export function Sheet({ open, onClose, children }) {
  useEffect(() => (open ? native.onBack(() => { onClose(); return true; }) : undefined), [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="backdrop" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className="sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose(); }}>
            <div className="grabber" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Toast({ msg }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div key={msg.id} className="toast"
          initial={{ opacity: 0, y: 24, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 12, x: '-50%' }}>
          {msg.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CountRing({ seconds, total }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84">
      <circle cx="42" cy="42" r={r} fill="none" stroke="#263142" strokeWidth="7" />
      <circle cx="42" cy="42" r={r} fill="none" stroke="#47e5b4" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - seconds / total)} transform="rotate(-90 42 42)"
        style={{ transition: 'stroke-dashoffset 1s linear' }} />
      <text x="42" y="50" textAnchor="middle" fontSize="24" fontWeight="800" fill="#e9eef5" fontFamily="Plus Jakarta Sans">{seconds}</text>
    </svg>
  );
}

export function useCountUp(target, ms = 450) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now(), a = from.current;
    let raf;
    const step = now => {
      const k = Math.min(1, (now - start) / ms), e = 1 - Math.pow(1 - k, 3);
      const cur = a + (target - a) * e;
      setV(cur);
      from.current = cur;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}
