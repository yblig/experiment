// Live-synthesised instruments: Karplus-Strong guitar, additive piano, drum kit,
// theremin and a backing-beat sequencer. Everything goes through one bus with
// reverb + compressor into the audio manager's sfx bus.
import { audio } from './lib/audio.js';
import { settings } from './settings.js';

const ctx = audio.ctx;
const SR = ctx.sampleRate;
export const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const noteName = m => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
export const pc = m => NAMES[((m % 12) + 12) % 12];

// ---------- master chain ----------
const inst = ctx.createGain();
const dry = ctx.createGain();
const wet = ctx.createGain();
const verb = ctx.createConvolver();
const comp = ctx.createDynamicsCompressor();
comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
verb.buffer = (() => {
  const len = Math.floor(SR * 2.4), b = ctx.createBuffer(2, len, SR);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  return b;
})();
inst.connect(dry); inst.connect(verb); verb.connect(wet);
dry.connect(comp); wet.connect(comp); comp.connect(audio.sfxBus);
const beatBus = ctx.createGain(); beatBus.connect(comp);

export function applyMix() {
  inst.gain.value = settings.get('instVol');
  wet.gain.value = settings.get('reverb') * 0.9;
  dry.gain.value = 1;
  beatBus.gain.value = settings.get('beatVol');
}
applyMix();

// recording hook (set by the looper)
let recorder = null;
export function setRecorder(fn) { recorder = fn; }
function rec(kind, args) { if (recorder) recorder(kind, args); }

// ---------- guitar ----------
const gCache = new Map();
const TONES = {
  acoustic: { decay: 0.9965, bright: 0.55, dur: 3.2 },
  nylon: { decay: 0.9955, bright: 0.25, dur: 2.6 },
  electric: { decay: 0.9985, bright: 0.7, dur: 3.6 },
  drive: { decay: 0.9988, bright: 0.8, dur: 3.6 }
};
function stringBuffer(midi, tone) {
  const key = tone + midi;
  if (gCache.has(key)) return gCache.get(key);
  const t = TONES[tone] || TONES.acoustic;
  const f = mtof(midi), N = Math.max(2, Math.round(SR / f)), len = Math.floor(SR * t.dur);
  const buf = ctx.createBuffer(1, len, SR), y = buf.getChannelData(0);
  // excitation: filtered noise burst (brightness = less smoothing)
  let prev = 0;
  for (let i = 0; i < N; i++) { const n = Math.random() * 2 - 1; prev = prev + (n - prev) * (0.15 + t.bright * 0.8); y[i] = prev; }
  const dec = Math.pow(t.decay, 110 / f * 2.2 + 0.4);
  for (let i = N; i < len; i++) y[i] = dec * 0.5 * (y[i - N] + y[i - N - 1 < 0 ? 0 : i - N - 1]);
  // normalise + gentle fade out at the end
  let peak = 0; for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(y[i]));
  const fade = Math.floor(SR * 0.3);
  for (let i = 0; i < len; i++) { y[i] /= peak || 1; if (i > len - fade) y[i] *= (len - i) / fade; }
  gCache.set(key, buf);
  return buf;
}
const driveCurve = (() => { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; c[i] = Math.tanh(x * 6) * 0.8; } return c; })();
const toneIn = {};
(function buildTones() {
  const ac = ctx.createBiquadFilter(); ac.type = 'highshelf'; ac.frequency.value = 3000; ac.gain.value = 2; ac.connect(inst); toneIn.acoustic = ac;
  const ny = ctx.createBiquadFilter(); ny.type = 'lowpass'; ny.frequency.value = 2600; ny.connect(inst); toneIn.nylon = ny;
  const el = ctx.createBiquadFilter(); el.type = 'lowpass'; el.frequency.value = 4200; el.Q.value = 1.2; el.connect(inst); toneIn.electric = el;
  const pre = ctx.createGain(); pre.gain.value = 1.6; const ws = ctx.createWaveShaper(); ws.curve = driveCurve; ws.oversample = '2x';
  const cab = ctx.createBiquadFilter(); cab.type = 'lowpass'; cab.frequency.value = 3200; const post = ctx.createGain(); post.gain.value = 0.55;
  pre.connect(ws).connect(cab).connect(post).connect(inst); toneIn.drive = pre;
})();
const ringing = [];
export function warmGuitar(chords, tone = settings.get('tone')) {
  chords.forEach(c => c.notes.forEach(n => n != null && stringBuffer(n, tone)));
}
export function strum(chord, dir = 1, vel = 0.8, fromPlayback = false) {
  if (!fromPlayback) rec('strum', [chord.name, chord.notes, dir, vel]);
  const tone = settings.get('tone');
  const now = ctx.currentTime;
  // damp strings that are still ringing
  ringing.forEach(r => { try { r.g.gain.setTargetAtTime(0, now, 0.03); r.s.stop(now + 0.25); } catch { /* done */ } });
  ringing.length = 0;
  const idx = chord.notes.map((n, i) => (n == null ? null : i)).filter(i => i != null);
  if (dir < 0) idx.reverse();
  const gap = 0.006 + (1 - vel) * 0.014;
  idx.forEach((si, k) => {
    const s = ctx.createBufferSource(); s.buffer = stringBuffer(chord.notes[si], tone);
    const g = ctx.createGain(); g.gain.value = (0.16 + vel * 0.2) * (dir < 0 && k > 2 ? 0.8 : 1);
    s.detune.value = (Math.random() - 0.5) * 6;
    s.connect(g).connect(toneIn[tone] || toneIn.acoustic);
    s.start(now + k * gap);
    ringing.push({ s, g });
  });
}

// ---------- piano ----------
const pCache = new Map();
function pianoBuffer(midi) {
  if (pCache.has(midi)) return pCache.get(midi);
  const f = mtof(midi), dur = 2.6, len = Math.floor(SR * dur);
  const buf = ctx.createBuffer(1, len, SR), y = buf.getChannelData(0);
  const parts = [1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = 0; i < len; i++) {
    const t = i / SR; let v = 0;
    for (const k of parts) { if (f * k > SR / 2.2) break; v += Math.sin(2 * Math.PI * f * k * t * (1 + 0.0004 * k * k)) * Math.exp(-t * (1.1 + k * 0.7 + f / 900)) / Math.pow(k, 1.15); }
    const atk = Math.min(1, t / 0.004);
    y[i] = v * atk + (t < 0.01 ? (Math.random() * 2 - 1) * 0.08 * (1 - t / 0.01) : 0);
  }
  let peak = 0; for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(y[i]));
  for (let i = 0; i < len; i++) y[i] /= peak || 1;
  pCache.set(midi, buf); return buf;
}
export function warmPiano(notes) { notes.forEach(pianoBuffer); }
export function pianoNote(midi, vel = 0.8, fromPlayback = false) {
  if (!fromPlayback) rec('piano', [midi, vel]);
  const s = ctx.createBufferSource(); s.buffer = pianoBuffer(midi);
  const g = ctx.createGain(); g.gain.value = 0.32 * (0.5 + vel * 0.5);
  s.connect(g).connect(inst); s.start();
}

// ---------- drums ----------
const dBuf = {};
function mk(dur, fn) { const len = Math.floor(SR * dur), b = ctx.createBuffer(1, len, SR), d = b.getChannelData(0); let st = { lp: 0, hp: 0, prev: 0 }; for (let i = 0; i < len; i++) d[i] = fn(i / SR, st); return b; }
function buildDrums() {
  let phase = 0;
  dBuf.kick = mk(0.55, t => { const f = 46 + 120 * Math.exp(-t * 30); phase += 2 * Math.PI * f / SR; return Math.sin(phase) * Math.exp(-t * 6) + (t < 0.003 ? (Math.random() - 0.5) * 0.5 : 0); });
  dBuf.snare = mk(0.32, (t, s) => { const n = Math.random() * 2 - 1; s.hp = n - s.prev; s.prev = n; return (s.hp * 0.6 * Math.exp(-t * 14) + Math.sin(2 * Math.PI * 190 * t) * 0.5 * Math.exp(-t * 22)); });
  dBuf.hat = mk(0.09, (t, s) => { const n = Math.random() * 2 - 1; const h = n - s.prev; s.prev = n; return h * 0.5 * Math.exp(-t * 55); });
  dBuf.crash = mk(1.8, (t, s) => { const n = Math.random() * 2 - 1; const h = n - s.prev; s.prev = n; return h * 0.42 * Math.exp(-t * 2.3) * Math.min(1, t / 0.003); });
  let p1 = 0; dBuf.tom1 = mk(0.5, t => { const f = 150 + 70 * Math.exp(-t * 14); p1 += 2 * Math.PI * f / SR; return Math.sin(p1) * Math.exp(-t * 7) * 0.9; });
  let p2 = 0; dBuf.tom2 = mk(0.6, t => { const f = 98 + 50 * Math.exp(-t * 12); p2 += 2 * Math.PI * f / SR; return Math.sin(p2) * Math.exp(-t * 6) * 0.95; });
  dBuf.rim = mk(0.08, t => Math.sin(2 * Math.PI * 1700 * t) * Math.exp(-t * 70) * 0.5 + Math.sin(2 * Math.PI * 820 * t) * Math.exp(-t * 60) * 0.4);
  dBuf.click = mk(0.04, t => Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 120) * 0.5);
}
buildDrums();
export function drum(name, vel = 0.9, fromPlayback = false, bus = inst, when = 0) {
  if (!fromPlayback && bus === inst) rec('drum', [name, vel]);
  const s = ctx.createBufferSource(); s.buffer = dBuf[name];
  const g = ctx.createGain(); g.gain.value = 0.55 * (0.35 + vel * 0.65) * (name === 'kick' ? 1.3 : 1);
  s.connect(g).connect(bus); s.start(when || 0);
}

// ---------- theremin ----------
let thr = null;
export function thereminSet(freq, vol, fromPlayback = false) {
  if (!fromPlayback) rec('thr', [freq, vol]);
  const now = ctx.currentTime;
  if (!thr) {
    const o = ctx.createOscillator(); o.type = settings.get('wave');
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.4; const lg = ctx.createGain(); lg.gain.value = 6;
    lfo.connect(lg).connect(o.detune);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.type === 'sine' ? 6000 : 2400;
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(lp).connect(g).connect(inst); o.start(); lfo.start();
    o.frequency.value = freq;
    thr = { o, lfo, g };
  }
  thr.o.frequency.setTargetAtTime(freq, now, 0.025);
  thr.g.gain.setTargetAtTime(vol * (thr.o.type === 'sine' ? 0.32 : 0.16), now, 0.03);
}
export function thereminOff(fromPlayback = false) {
  if (!thr) return;
  if (!fromPlayback) rec('thrOff', []);
  const t = thr, now = ctx.currentTime; thr = null;
  t.g.gain.setTargetAtTime(0, now, 0.05);
  setTimeout(() => { try { t.o.stop(); t.lfo.stop(); } catch { /* */ } }, 400);
}

// ---------- backing beat ----------
export const GROOVES = {
  rock: { name: 'Rock', kick: 'x...x...x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
  pop: { name: 'Pop', kick: 'x.....x.x.......', snare: '....x.......x..x', hat: 'xxxxxxxxxxxxxxxx' },
  reggae: { name: 'Reggae', kick: '........x.......', snare: '........x.......', hat: '..x...x...x...x.', rim: '....x.......x...' },
  ballad: { name: 'Ballad', kick: 'x.......x.x.....', snare: '........x.......', hat: 'x...x...x...x...', rim: '....x.......x...' }
};
let beatTimer = null, step = 0, nextT = 0;
const beatListeners = new Set();
export const onBeat = fn => { beatListeners.add(fn); return () => beatListeners.delete(fn); };
export const beatOn = () => !!beatTimer;
export function startBeat() {
  if (beatTimer) return;
  step = 0; nextT = ctx.currentTime + 0.08;
  beatTimer = setInterval(() => {
    const g = GROOVES[settings.get('groove')] || GROOVES.rock;
    const spb = 60 / settings.get('bpm') / 4;
    while (nextT < ctx.currentTime + 0.12) {
      const i = step % 16;
      for (const part of ['kick', 'snare', 'hat', 'rim']) if (g[part] && g[part][i] === 'x') drum(part, part === 'hat' ? (i % 4 === 0 ? 0.7 : 0.45) : 0.85, true, beatBus, nextT);
      if (i % 4 === 0) { const d = (nextT - ctx.currentTime) * 1000, b = i / 4; setTimeout(() => beatListeners.forEach(f => f(b)), Math.max(0, d)); }
      nextT += spb; step++;
    }
  }, 25);
}
export function stopBeat() { clearInterval(beatTimer); beatTimer = null; }

// ---------- playback of recorded events ----------
export function replay(kind, a) {
  if (kind === 'strum') strum({ name: a[0], notes: a[1] }, a[2], a[3], true);
  else if (kind === 'piano') pianoNote(a[0], a[1], true);
  else if (kind === 'drum') drum(a[0], a[1], true);
  else if (kind === 'thr') thereminSet(a[0], a[1], true);
  else if (kind === 'thrOff') thereminOff(true);
}
