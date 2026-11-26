import { storage } from './lib/storage.js';

const DEFAULTS = {
  instVol: 0.9, reverb: 0.35, beatVol: 0.6, uiVol: 0.7,
  tone: 'acoustic', chordSet: 'popC', sens: 'mid', lefty: false, skeleton: true, dim: 0.35,
  facing: 'user', scale: 'major', root: 0, octave: 4, wave: 'sine', snap: true,
  bpm: 96, groove: 'rock', haptics: true
};
let data = { ...DEFAULTS, ...storage.get('settings', {}) };
const subs = new Set();

export const settings = {
  get: k => data[k],
  set(k, v) { data[k] = v; storage.set('settings', data); subs.forEach(f => f(k, v)); },
  on(fn) { subs.add(fn); return () => subs.delete(fn); },
  all: () => data
};

export const SENS = { low: 0.75, mid: 1, high: 1.35 };
export const sens = () => SENS[data.sens] || 1;

// Guitar voicings on standard tuning (E2 A2 D3 G3 B3 E4), null = muted string.
const V = {
  C: [null, 48, 52, 55, 60, 64], G: [43, 47, 50, 55, 59, 67], Am: [null, 45, 52, 57, 60, 64],
  F: [41, 48, 53, 57, 60, 65], Dm: [null, null, 50, 57, 62, 65], Em: [40, 47, 52, 55, 59, 64],
  D: [null, null, 50, 57, 62, 66], Bm: [null, 47, 54, 59, 62, 66], E: [40, 47, 52, 56, 59, 64],
  A: [null, 45, 52, 57, 61, 64], A7: [null, 45, 52, 55, 61, 64], D7: [null, null, 50, 57, 60, 66],
  E7: [40, 47, 50, 56, 59, 64], B7: [null, 47, 51, 57, 59, 66], 'F#m': [42, 49, 54, 57, 61, 66],
  E5: [40, 47, 52, null, null, null], A5: [null, 45, 52, 57, null, null], D5: [null, null, 50, 57, 62, null],
  G5: [43, 50, 55, null, null, null], C5: [null, 48, 55, 60, null, null], B5: [null, 47, 54, 59, null, null]
};
// index 0 = fist, 1..5 = number of fingers up
export const CHORD_SETS = {
  popC: { name: 'Pop in C', chords: ['Em', 'C', 'G', 'Am', 'F', 'Dm'] },
  popG: { name: 'Pop in G', chords: ['Bm', 'G', 'D', 'Em', 'C', 'Am'] },
  sad: { name: 'Galau in Am', chords: ['E', 'Am', 'F', 'C', 'G', 'Dm'] },
  ballad: { name: 'Ballad in D', chords: ['F#m', 'D', 'A', 'Bm', 'G', 'Em'] },
  blues: { name: 'Blues in A', chords: ['E', 'A7', 'D7', 'E7', 'A', 'B7'] },
  rock: { name: 'Power rock', chords: ['B5', 'E5', 'A5', 'D5', 'G5', 'C5'] }
};
export const chordSet = () => {
  const set = CHORD_SETS[data.chordSet] || CHORD_SETS.popC;
  return set.chords.map(n => ({ name: n, notes: V[n] }));
};

export const SCALES = {
  major: { name: 'Major', steps: [0, 2, 4, 5, 7, 9, 11, 12] },
  minor: { name: 'Minor', steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  penta: { name: 'Pentatonic', steps: [0, 2, 4, 7, 9, 12, 14, 16] },
  blues: { name: 'Blues', steps: [0, 3, 5, 6, 7, 10, 12, 15] }
};
export const ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ROOT_PC = [0, 2, 4, 5, 7, 9, 11];
export const pianoNotes = () => {
  const base = 12 * (data.octave + 1) + ROOT_PC[data.root];
  return (SCALES[data.scale] || SCALES.major).steps.map(s => base + s);
};
