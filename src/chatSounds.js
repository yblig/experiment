// Message sounds: each template has its own send/receive sound; the user can replace them with their
// own audio files (stored in the app's data folder).
//
// Android notes: sounds play through the audio manager's AudioContext, which is unlocked on the
// first touch (a context created later, e.g. from a timer in Play mode, would stay suspended and
// play nothing). Imported files are read back with the Filesystem plugin instead of fetch() on a
// file URL, so nothing depends on the WebView's local file server.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useStore } from './store.js';
import { audio } from './lib/audio.js';
import { haptics } from './lib/haptics.js';

const native = Capacitor.isNativePlatform();
const SET = k => useStore.getState().settings[k];

// Where a template's sound comes from: an imported file ref ("media/…" or a data: URL) or a bundled wav.
export function soundSource(template, kind) {
  if (kind === 'keys') return { src: 'audio/chat/keys.wav', custom: false, name: null };
  const slots = SET('tplSounds')?.[template] || {};
  const per = slots[kind]?.ref ? slots[kind] : slots[kind === 'send' ? 'recv' : 'send'];
  if (per?.ref) return { src: per.ref, custom: true, name: per.name };
  const g = SET(kind === 'send' ? 'sendSound' : 'recvSound') || SET(kind === 'send' ? 'recvSound' : 'sendSound');
  if (g?.ref) return { src: g.ref, custom: true, name: g.name };
  const t = template === 'lock' && kind === 'send' ? 'lock' : template || 'whatsapp';
  return { src: `audio/chat/${t}_${kind}.wav`, custom: false, name: null };
}
export const soundUrl = (template, kind) => soundSource(template, kind).src;

function b64ToBuf(b64) {
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}
export async function loadBytes(src) {
  if (src.startsWith('data:')) return b64ToBuf(src.split(',')[1]);
  if (native && src.startsWith('media/')) {
    const r = await Filesystem.readFile({ path: src, directory: Directory.Data });
    return typeof r.data === 'string' ? b64ToBuf(r.data) : await r.data.arrayBuffer();
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.arrayBuffer();
}

const cache = new Map();
function buffer(src) {
  if (!cache.has(src)) {
    const p = loadBytes(src).then(b => audio.ctx.decodeAudioData(b));
    p.catch(() => cache.delete(src));
    cache.set(src, p);
  }
  return cache.get(src);
}
export function clearSoundCache() { cache.clear(); }
export function preloadChatSounds(template) {
  ['send', 'recv'].forEach(k => buffer(soundSource(template, k).src).catch(() => {}));
}

// Seconds of silence at the start of a sound file (so imported sounds play right on cue).
export function leadIn(buf) {
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > 0.02) return Math.max(0, i / buf.sampleRate - 0.01);
  return 0;
}

export async function playChatSound(template, kind, { force = false } = {}) {
  if (!force && !SET('sound')) return false;
  if (SET('haptics')) try { haptics.light(); } catch { /* ignore */ }
  const ctx = audio.ctx;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  try {
    const b = await buffer(soundSource(template, kind).src);
    if (ctx.state !== 'running') await ctx.resume().catch(() => {});
    const s = ctx.createBufferSource();
    const g = ctx.createGain(); g.gain.value = 1;
    s.buffer = b; s.connect(g).connect(ctx.destination);
    s.start(0, leadIn(b));
    return true;
  } catch { return false; }
}

// Plays the sound and explains what happened (shown in the Sounds sheet).
export async function testChatSound(template, kind) {
  const info = soundSource(template, kind);
  try {
    const b = await buffer(info.src);
    await playChatSound(template, kind, { force: true });
    return { ok: true, text: `${info.custom ? info.name : 'Suara bawaan'} · ${b.duration.toFixed(1)} dtk${audio.ctx.state !== 'running' ? ' · audio HP masih terkunci, ketuk layar sekali lalu coba lagi' : ''}` };
  } catch (e) {
    return { ok: false, text: `Gagal memutar ${info.custom ? info.name : 'suara bawaan'}: ${e?.message || e}` };
  }
}

// Guess which template + slot a sound file belongs to from its name.
const KEYS = [
  ['whatsapp', /whats\s*app|\bwa\b/i], ['imessage', /iphone|imessage|\bios\b|apple/i], ['snapchat', /snap/i],
  ['telegram', /telegram|\btg\b/i], ['instagram', /insta|\big\b/i], ['messenger', /messenger|facebook|\bfb\b/i],
  ['line', /\bline\b/i], ['tinder', /tinder/i], ['kakao', /kakao/i], ['sms', /\bsms\b|android|samsung/i], ['x', /twitter|\bx\b/i]
];
export function guessSlot(fileName) {
  const n = fileName.replace(/[-_.]+/g, ' ');
  const tpl = KEYS.find(([, re]) => re.test(n))?.[0] || null;
  const kind = /swoosh|\bsend|\bsent|kirim|outgoing|keluar/i.test(n) ? 'send' : 'recv';
  return { tpl, kind };
}
