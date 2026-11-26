// UI feedback: sound + haptic, both respecting the settings toggles.
import { audio } from './audio.js';
import { haptics } from './haptics.js';
import { useStore } from '../store.js';

const SOUNDS = ['tap', 'add', 'remove', 'cash', 'success', 'print', 'error', 'toggle', 'whoosh', 'unlock', 'key'];
export async function loadSounds() {
  await audio.load(Object.fromEntries(SOUNDS.map(k => [k, `audio/${k}.wav`])));
}
export function syncFx() {
  const s = useStore.getState().settings;
  audio.set({ muted: !s.sound, sfx: 0.55 });
  haptics.setEnabled(s.haptics);
}
const H = { tap: 'tap', add: 'light', remove: 'light', cash: 'success', success: 'success', print: 'medium', error: 'error', toggle: 'tap', whoosh: null, unlock: 'success', key: 'tap' };
export function fx(name, opts) {
  audio.play(name, opts);
  const h = H[name];
  if (h) haptics[h]?.();
}
