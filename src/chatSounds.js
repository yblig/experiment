// Message sounds: each template has its own send/receive sound; the user can replace them
// with their own audio files (stored in the app's data folder).
import { useStore } from './store.js';
import { mediaUrl } from './media.js';
import { haptics } from './lib/haptics.js';

const SET = s => useStore.getState().settings[s];
export function soundUrl(template, kind) {
  const slots = SET('tplSounds')?.[template] || {};
  // one imported file for an app is used for both sending and receiving
  const per = slots[kind]?.ref ? slots[kind] : slots[kind === 'send' ? 'recv' : 'send'];
  if (per?.ref) return mediaUrl(per.ref);
  const custom = SET(kind === 'send' ? 'sendSound' : 'recvSound') || SET(kind === 'send' ? 'recvSound' : 'sendSound');
  if (custom?.ref) return mediaUrl(custom.ref);
  const t = template === 'lock' && kind === 'send' ? 'lock' : template || 'whatsapp';
  return `audio/chat/${t}_${kind}.wav`;
}

let ctx = null;
const cache = new Map();
async function buffer(url) {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (!cache.has(url)) cache.set(url, fetch(url).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)).catch(() => null));
  return cache.get(url);
}
export function clearSoundCache() { cache.clear(); }

export async function playChatSound(template, kind) {
  if (!SET('sound')) return;
  if (SET('haptics')) try { haptics.light(); } catch { /* ignore */ }
  try {
    const b = await buffer(soundUrl(template, kind));
    if (!b) return;
    if (ctx.state === 'suspended') await ctx.resume();
    const s = ctx.createBufferSource();
    s.buffer = b; s.connect(ctx.destination); s.start(0, leadIn(b));
  } catch { /* ignore */ }
}

// Seconds of silence at the start of a sound file (so imported sounds play right on cue).
export function leadIn(buf) {
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > 0.02) return Math.max(0, i / buf.sampleRate - 0.01);
  return 0;
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
