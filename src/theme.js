import Phaser from 'phaser';

export const C = {
  bg: 0x1a1033, surface: 0x2d1b5a, panel: 0x3b2675, accent: 0xff6b35, gold: 0xf7c548,
  cyan: 0x00d1ff, outline: 0x140b2b, white: 0xffffff, green: 0x2fd27a, red: 0xff4d5e, grey: 0x6b6385
};
export const PCOL = [0xff4d5e, 0x3d8bff, 0x2fd27a, 0xffc93c];
export const PDARK = [0xc22a3d, 0x1f5fc9, 0x18a058, 0xd99a12];
export const PCSS = ['#ff4d5e', '#3d8bff', '#2fd27a', '#ffc93c'];
export const PNAME = ['MERAH', 'BIRU', 'HIJAU', 'KUNING'];
export const F = { title: 'Lilita One', body: 'Fredoka' };

export function darken(c, amt = 28) { return Phaser.Display.Color.IntegerToColor(c).darken(amt).color; }
export function lighten(c, amt = 20) { return Phaser.Display.Color.IntegerToColor(c).lighten(amt).color; }

export function txt(sc, x, y, s, size = 48, color = '#ffffff', o = {}) {
  const t = sc.add.text(x, y, s, {
    fontFamily: o.font || F.title, fontSize: Math.round(size) + 'px', color,
    stroke: o.stroke ?? '#140b2b', strokeThickness: o.st ?? Math.max(3, Math.round(size * 0.15)),
    align: o.align || 'center', wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined,
    lineSpacing: o.ls || 0
  }).setOrigin(o.ox ?? 0.5, o.oy ?? 0.5);
  if (o.shadow !== false) t.setShadow(0, Math.max(2, size * 0.07), 'rgba(0,0,0,0.45)', 0, true, true);
  return t;
}
export function body(sc, x, y, s, size = 34, color = '#ffffff', o = {}) {
  return txt(sc, x, y, s, size, color, { font: F.body, st: o.st ?? Math.max(2, Math.round(size * 0.12)), shadow: false, ...o });
}
