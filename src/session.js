import { storage } from './lib/storage.js';

// Cross-scene state: number of human players, the running tournament, stats.
export const session = {
  humans: 2,
  tour: null, // { games:[id], idx, trophies:[n,n,n,n], slots }
  cat: 'all',
  scrollY: 0
};

export const stats = {
  get() { return storage.get('stats', { matches: 0, plays: {}, winsBy: [0, 0, 0, 0] }); },
  recordMatch(gameId, winners) {
    const s = this.get();
    s.matches++;
    s.plays[gameId] = (s.plays[gameId] || 0) + 1;
    for (const w of winners) if (w >= 0 && w < 4) s.winsBy[w]++;
    storage.set('stats', s);
  },
  plays(id) { return this.get().plays[id] || 0; }
};

// Build the slot list for a game given how many humans are holding the phone.
export function slotsFor(meta, humans) {
  let n = humans === 1 ? (meta.solo ?? Math.min(2, meta.max)) : humans;
  n = Math.max(meta.min, Math.min(meta.max, n));
  if (meta.even && n % 2) n++;
  if (n > meta.max) n = meta.max;
  return Array.from({ length: n }, (_, i) => ({ p: i, cpu: i >= humans }));
}
export function supports(meta, humans) { return humans <= meta.max; }
