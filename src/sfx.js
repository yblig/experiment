import { audio } from './lib/audio.js';
import { haptics } from './lib/haptics.js';

export async function initSfx() {
  const names = ['tap', 'toggle', 'tick', 'confirm', 'back', 'open', 'error', 'count'];
  await audio.load(Object.fromEntries(names.map(n => [n, `audio/${n}.wav`])));
}

export const fx = {
  tap() { audio.play('tap'); haptics.tap(); },
  toggle() { audio.play('toggle'); haptics.light(); },
  tick(rate = 1) { audio.play('tick', { rate, throttleMs: 45 }); haptics.tap(); },
  confirm() { audio.play('confirm'); haptics.success(); },
  back() { audio.play('back'); haptics.tap(); },
  open() { audio.play('open'); },
  error() { audio.play('error'); haptics.error(); },
  count() { audio.play('count', { throttleMs: 200 }); haptics.light(); }
};

export const soundOn = () => !audio.settings.muted;
export const setSound = on => audio.set({ muted: !on });
export const hapticsOn = () => haptics.isEnabled();
export const setHaptics = on => haptics.setEnabled(on);
