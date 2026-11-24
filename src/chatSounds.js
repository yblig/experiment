// Message sounds: each template has its own send/receive sound; the user can replace them
// with their own audio files (stored in the app's data folder).
import { useStore } from './store.js';
import { mediaUrl } from './media.js';
import { haptics } from './lib/haptics.js';

const SET = s => useStore.getState().settings[s];
export function soundUrl(template, kind) {
  const custom = SET(kind === 'send' ? 'sendSound' : 'recvSound');
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
    s.buffer = b; s.connect(ctx.destination); s.start();
  } catch { /* ignore */ }
}
