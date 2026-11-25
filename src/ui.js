import Phaser from 'phaser';
import { C, darken, txt, body } from './theme.js';
import { audio } from './lib/audio.js';
import { haptics } from './lib/haptics.js';

export function fadeTo(scene, key, data) {
  if (scene._leaving) return;
  scene._leaving = true;
  scene.cameras.main.fadeOut(220, 20, 11, 43);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}

// Chunky 3D button. Returns a container with .setLabel(), .setEnabled()
export function button(sc, x, y, w, h, label, { color = C.accent, size, icon, onClick, sound = 'tap', font } = {}) {
  const c = sc.add.container(x, y);
  const g = sc.add.graphics();
  const base = Math.round(h * 0.12);
  const r = Math.min(h * 0.34, 44);
  const top = sc.add.container(0, 0);
  const t = txt(sc, icon ? 24 : 0, 0, label, size || Math.min(h * 0.42, 64), '#ffffff', font ? { font } : {});
  top.add(t);
  let ic;
  if (icon) { ic = sc.add.image(-t.width / 2 - 14, 0, icon).setDisplaySize(h * 0.48, h * 0.48); top.add(ic); }
  c.add([g, top]);
  let col = color, enabled = true;
  const draw = (pressed) => {
    g.clear();
    g.fillStyle(0x000000, 0.28).fillRoundedRect(-w / 2, -h / 2 + base + 8, w, h, r);
    g.fillStyle(C.outline, 1).fillRoundedRect(-w / 2 - 5, -h / 2 - 5 + (pressed ? base : 0), w + 10, h + 10 + (pressed ? 0 : base), r + 4);
    g.fillStyle(darken(col, 22), 1).fillRoundedRect(-w / 2, -h / 2 + base, w, h, r);
    const oy = pressed ? base : 0;
    g.fillStyle(col, 1).fillRoundedRect(-w / 2, -h / 2 + oy, w, h, r);
    g.fillStyle(0xffffff, 0.2).fillRoundedRect(-w / 2 + 10, -h / 2 + oy + 7, w - 20, h * 0.38, { tl: r - 8, tr: r - 8, bl: 10, br: 10 });
    top.y = oy;
  };
  draw(false);
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h + base), Phaser.Geom.Rectangle.Contains);
  let down = false;
  c.on('pointerdown', () => { if (!enabled) return; down = true; draw(true); audio.play(sound); haptics.tap(); });
  c.on('pointerout', () => { if (down) { down = false; draw(false); } });
  c.on('pointerup', () => {
    if (!down) return; down = false; draw(false);
    sc.tweens.add({ targets: c, scale: { from: 0.94, to: 1 }, duration: 260, ease: 'Back.easeOut' });
    onClick && onClick();
  });
  c.setLabel = (s) => { t.setText(s); return c; };
  c.setEnabled = (on) => { enabled = on; c.setAlpha(on ? 1 : 0.45); return c; };
  c.setColor = (cc) => { col = cc; draw(false); return c; };
  c.w = w; c.h = h; c.top = top; c.labelText = t;
  return c;
}

export function iconButton(sc, x, y, r, icon, { color = C.panel, onClick, sound = 'tap' } = {}) {
  const c = sc.add.container(x, y);
  const g = sc.add.graphics();
  const draw = (p) => {
    g.clear();
    g.fillStyle(0x000000, 0.3).fillCircle(0, 8, r);
    g.fillStyle(C.outline, 1).fillCircle(0, p ? 6 : 3, r + 5);
    g.fillStyle(darken(color, 25), 1).fillCircle(0, 6, r);
    g.fillStyle(color, 1).fillCircle(0, p ? 6 : 0, r);
    g.fillStyle(0xffffff, 0.18).fillEllipse(-r * 0.2, (p ? 6 : 0) - r * 0.45, r * 1.2, r * 0.6);
    im.y = p ? 6 : 0;
  };
  const im = sc.add.image(0, 0, icon).setDisplaySize(r * 1.05, r * 1.05);
  c.add([g, im]);
  draw(false);
  c.setInteractive(new Phaser.Geom.Circle(0, 0, r + 14), Phaser.Geom.Circle.Contains);
  let down = false;
  c.on('pointerdown', () => { down = true; draw(true); audio.play(sound); haptics.tap(); });
  c.on('pointerout', () => { if (down) { down = false; draw(false); } });
  c.on('pointerup', () => { if (!down) return; down = false; draw(false); onClick && onClick(); });
  c.setIcon = (k) => im.setTexture(k).setDisplaySize(r * 1.05, r * 1.05);
  return c;
}

export function panel(sc, x, y, w, h, { color = C.surface, title, titleColor = C.accent } = {}) {
  const c = sc.add.container(x, y);
  const g = sc.add.graphics();
  g.fillStyle(0x000000, 0.35).fillRoundedRect(-w / 2, -h / 2 + 14, w, h, 48);
  g.fillStyle(C.outline, 1).fillRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 52);
  g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 46);
  g.fillStyle(0xffffff, 0.06).fillRoundedRect(-w / 2 + 14, -h / 2 + 14, w - 28, h * 0.3, 36);
  c.add(g);
  if (title) {
    const rg = sc.add.graphics();
    const tw = Math.min(w * 0.8, 640), th = 110;
    rg.fillStyle(C.outline, 1).fillRoundedRect(-tw / 2 - 6, -h / 2 - th / 2 - 6, tw + 12, th + 12, 40);
    rg.fillStyle(titleColor, 1).fillRoundedRect(-tw / 2, -h / 2 - th / 2, tw, th, 36);
    rg.fillStyle(0xffffff, 0.2).fillRoundedRect(-tw / 2 + 10, -h / 2 - th / 2 + 8, tw - 20, 40, 18);
    c.add([rg, txt(sc, 0, -h / 2, title, 62)]);
  }
  return c;
}

export function backdrop(sc, alpha = 0.65) {
  const { width: W, height: H } = sc.scale;
  const r = sc.add.rectangle(W / 2, H / 2, W * 2, H * 2, 0x07031a, alpha).setInteractive();
  r.alpha = 0; sc.tweens.add({ targets: r, alpha: 1, duration: 180 });
  return r;
}

export function popIn(sc, obj, delay = 0) {
  obj.setScale(0.6); obj.alpha = 0;
  sc.tweens.add({ targets: obj, scale: 1, alpha: 1, duration: 380, delay, ease: 'Back.easeOut' });
}

export function toggle(sc, x, y, label, icon, value, onChange) {
  const c = sc.add.container(x, y);
  const w = 720, h = 130;
  const bg = sc.add.graphics();
  bg.fillStyle(0x000000, 0.25).fillRoundedRect(-w / 2, -h / 2, w, h, 36);
  const im = sc.add.image(-w / 2 + 70, 0, icon).setDisplaySize(62, 62);
  const t = body(sc, -w / 2 + 130, 0, label, 44, '#ffffff', { ox: 0 });
  const sw = sc.add.graphics();
  const knob = sc.add.circle(0, 0, 34, 0xffffff).setStrokeStyle(6, C.outline);
  c.add([bg, im, t, sw, knob]);
  const sx = w / 2 - 110;
  const draw = () => {
    sw.clear();
    sw.fillStyle(C.outline, 1).fillRoundedRect(sx - 76, -46, 152, 92, 46);
    sw.fillStyle(value ? C.green : C.grey, 1).fillRoundedRect(sx - 70, -40, 140, 80, 40);
    sc.tweens.add({ targets: knob, x: sx + (value ? 34 : -34), duration: 160, ease: 'Cubic.easeOut' });
  };
  knob.x = sx + (value ? 34 : -34);
  draw();
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  c.on('pointerup', () => { value = !value; audio.play('select'); haptics.tap(); draw(); onChange(value); });
  return c;
}

// Animated party background: gradient + slow drifting diagonal stripes + floating dots
export function partyBg(sc, c1 = 0x2d1b5a, c2 = 0x140b2b) {
  const { width: W, height: H } = sc.scale;
  const g = sc.add.graphics();
  g.fillGradientStyle(c1, c1, c2, c2, 1).fillRect(0, 0, W, H);
  const stripes = sc.add.tileSprite(W / 2, H / 2, W * 1.6, H * 1.6, 'stripes').setAlpha(0.07).setAngle(-20);
  sc.tweens.add({ targets: stripes, tilePositionX: 400, duration: 16000, repeat: -1 });
  for (let i = 0; i < 18; i++) {
    const d = sc.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), 'dot')
      .setScale(Phaser.Math.FloatBetween(0.6, 2.2)).setAlpha(Phaser.Math.FloatBetween(0.05, 0.18));
    sc.tweens.add({ targets: d, y: d.y - Phaser.Math.Between(120, 360), duration: Phaser.Math.Between(5000, 11000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  const v = sc.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W, H).setAlpha(0.8);
  return { g, stripes, v };
}

export function confetti(sc, x, y, count = 80, colors = [0xff4d5e, 0x3d8bff, 0x2fd27a, 0xffc93c, 0xffffff, 0xff6bd6]) {
  const em = sc.add.particles(x, y, 'confetti', {
    speed: { min: 400, max: 1300 }, angle: { min: 200, max: 340 }, gravityY: 1400,
    rotate: { start: 0, end: 720 }, scale: { min: 0.6, max: 1.3 }, lifespan: 2600,
    tint: colors, emitting: false
  });
  em.setDepth(50);
  em.explode(count);
  sc.time.delayedCall(3000, () => em.destroy());
  return em;
}

export function makeTextures(sc) {
  const g = sc.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1).fillCircle(16, 16, 16); g.generateTexture('dot', 32, 32); g.clear();
  g.fillStyle(0xffffff, 1).fillRect(0, 0, 18, 10); g.generateTexture('confetti', 18, 10); g.clear();
  g.fillStyle(0xffffff, 1);
  g.beginPath(); g.moveTo(12, 0); g.lineTo(15, 9); g.lineTo(24, 12); g.lineTo(15, 15); g.lineTo(12, 24); g.lineTo(9, 15); g.lineTo(0, 12); g.lineTo(9, 9); g.closePath(); g.fillPath();
  g.generateTexture('spark', 24, 24); g.clear();
  g.fillStyle(0xffffff, 1).fillRect(0, 0, 60, 120); g.fillStyle(0xffffff, 0).fillRect(60, 0, 60, 120);
  g.generateTexture('stripes', 120, 120); g.clear();
  // soft glow
  for (let r = 64; r > 0; r -= 2) { g.fillStyle(0xffffff, 0.02 + (64 - r) / 64 * 0.05); g.fillCircle(64, 64, r); }
  g.generateTexture('glow', 128, 128); g.clear();
  g.destroy();
  // vignette via canvas radial gradient
  const cv = sc.textures.createCanvas('vignette', 256, 256);
  const ctx = cv.getContext();
  const gr = ctx.createRadialGradient(128, 128, 60, 128, 128, 180);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(5,2,20,0.75)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 256, 256); cv.refresh();
}
