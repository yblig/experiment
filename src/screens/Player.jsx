// Play mode: messages appear one by one (with typing bubbles and sounds) so the screen can be recorded.
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import Shot from '../templates/Shot.jsx';
import { useBack } from '../components/ui.jsx';
import { fx } from '../fx.js';
import { uid, useStore } from '../store.js';
import { audio } from '../lib/audio.js';
import { playChatSound } from '../chatSounds.js';

export function buildFrames(chat) {
  const frames = [{ upto: 0, extra: null, ms: 900 }];
  chat.messages.forEach((m, i) => {
    if (m.kind === 'time' || m.kind === 'system' || m.kind === 'unread') return;
    const prev = chat.messages[i - 1];
    if (m.pause) frames[frames.length - 1].ms += m.pause * 1000;
    if (m.kind === 'msg' && m.from !== 'me' && prev?.kind !== 'typing') {
      frames.push({ upto: i, extra: { id: 'typ' + i, kind: 'typing', from: 'them', sender: m.sender }, ms: 700 + Math.min(1600, (m.text || '').length * 30) });
    }
    frames.push({
      upto: i + 1, extra: null, ms: m.kind === 'typing' ? 1400 : 650 + Math.min(1800, (m.text || '').length * 38),
      sound: m.kind === 'msg' ? (m.from === 'me' ? 'send' : 'receive') : null,
      keys: m.kind === 'msg' && m.from === 'me' && (m.type || 'text') === 'text'
    });
  });
  return frames;
}

export default function Player({ chat, onClose, startAt = 0 }) {
  const frames = useMemo(() => buildFrames(chat), [chat]);
  const [f, setF] = useState(() => Math.max(0, frames.findIndex(fr => fr.upto >= startAt)));
  const settings = useStore(st => st.settings);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [ui, setUi] = useState(true);
  const [size, setSize] = useState({ w: innerWidth, h: innerHeight });
  const timer = useRef(0);
  useBack(true, onClose);

  useEffect(() => {
    const r = () => setSize({ w: innerWidth, h: innerHeight });
    addEventListener('resize', r);
    return () => removeEventListener('resize', r);
  }, []);
  useEffect(() => {
    clearTimeout(timer.current);
    if (!playing) return;
    if (f >= frames.length - 1) { setPlaying(false); return; }
    const nxt = frames[f + 1];
    let kt = 0;
    if (nxt?.keys && settings.vKeys !== false && settings.sound) kt = setTimeout(() => playChatSound('keys', 'keys'), Math.max(0, frames[f].ms / speed - 750));
    timer.current = setTimeout(() => {
      const nx = frames[f + 1];
      if (nx?.sound) playChatSound(chat.template, nx.sound === 'send' ? 'send' : 'recv');
      setF(f + 1);
    }, frames[f].ms / speed);
    return () => { clearTimeout(timer.current); clearTimeout(kt); };
  }, [f, playing, speed, frames]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // background music while playing
    const m = settings.vMusic;
    if (!m || m === 'none' || !settings.sound) return;
    const key = 'music_' + m;
    let alive = true;
    audio.load({ [key]: `audio/music/${m}.ogg` }).then(() => { if (alive) audio.playMusic(key, { volume: settings.vMusicVol ?? 0.5 }); });
    return () => { alive = false; audio.stopMusic(0.4); };
  }, [settings.vMusic]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const id = setTimeout(() => setUi(false), 2500); return () => clearTimeout(id); }, []);

  const fr = frames[f];
  const view = useMemo(() => {
    const msgs = chat.messages.slice(0, fr.upto);
    return { ...chat, frame: 'phone', messages: fr.extra ? [...msgs, { ...fr.extra, id: fr.extra.id || uid() }] : msgs };
  }, [chat, fr]);
  const scale = Math.min(size.w / 390, size.h / 844);
  const done = f >= frames.length - 1;

  return (
    <motion.div className="player" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="player-stage" onClick={() => setUi(u => !u)}>
        <div style={{ width: 390 * scale, height: 844 * scale }}>
          <div style={{ width: 390, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <Shot chat={view} upto={view.messages.length} />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {ui && (
          <motion.div key="bar" className="player-bar" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
            <button className="icon-btn press" onClick={() => { fx.tap(); onClose(); }} aria-label="Tutup"><X size={22} /></button>
            <button className="icon-btn press" onClick={() => { fx.tap(); setF(0); setPlaying(true); }} aria-label="Ulang"><RotateCcw size={20} /></button>
            <button className="icon-btn press" style={{ background: 'var(--accent)', borderRadius: 14 }} onClick={() => { fx.tap(); if (done) { setF(0); setPlaying(true); } else setPlaying(p => !p); }} aria-label="Putar/Jeda">
              {playing ? <Pause size={22} fill="#fff" /> : <Play size={22} fill="#fff" />}
            </button>
            <div className="prog"><i style={{ width: `${(f / Math.max(1, frames.length - 1)) * 100}%` }} /></div>
            <button className="spd press" onClick={() => { fx.toggle(); setSpeed(s => ({ 1: 1.5, 1.5: 2, 2: 0.5, 0.5: 1 })[s]); }}>{speed}×</button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {ui && <motion.div key="tip" className="player-tip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Ketuk layar untuk sembunyikan tombol, lalu rekam layar</motion.div>}
      </AnimatePresence>
    </motion.div>
  );
}
