// Sound + haptic feedback, gated by the app's settings.
import { audio } from './lib/audio.js';
import { haptics } from './lib/haptics.js';
import { useStore } from './store.js';

const S = () => useStore.getState().settings;
const snd = (k, o) => { if (S().sound) try { audio.play(k, o); } catch { /* not loaded yet */ } };
const hap = k => { if (S().haptics) try { haptics[k](); } catch { /* ignore */ } };

export async function loadSounds() {
  const keys = ['tap', 'send', 'receive', 'delete', 'toggle', 'open', 'success', 'error'];
  await audio.load(Object.fromEntries(keys.map(k => [k, `audio/${k}.wav`]))).catch(() => {});
}

export const fx = {
  tap: () => { snd('tap'); hap('tap'); },
  toggle: () => { snd('toggle'); hap('tap'); },
  open: () => { snd('open'); },
  send: () => { snd('send'); hap('light'); },
  receive: () => { snd('receive'); hap('light'); },
  del: () => { snd('delete'); hap('medium'); },
  success: () => { snd('success'); hap('success'); },
  error: () => { snd('error'); hap('error'); }
};
