import Phaser from 'phaser';
import BaseGame, { TAU, rnd, irnd, clamp } from './BaseGame.js';
import { C, PCOL, txt, body } from '../theme.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';

// ---------------------------------------------------------------- Flappy race: every player gets their own lane
export class Flappy extends BaseGame {
  constructor() { super('flappy'); }
  setup() {
    const { W, H, n } = this;
    this.bg(0x6dd5fa, 0x2980b9);
    const rects = n <= 2 ? [[0, H / 2, W, H / 2, 0], [0, 0, W, H / 2, Math.PI]]
      : [[0, H / 2, W / 2, H / 2, 0], [W / 2, 0, W / 2, H / 2, Math.PI], [0, 0, W / 2, H / 2, Math.PI], [W / 2, H / 2, W / 2, H / 2, 0]];
    // shared course so it's fair: pipes at fixed distances with gap centres in 0..1
    this.course = Array.from({ length: 200 }, (_, k) => ({ d: 700 + k * 430, gy: rnd(0.25, 0.75) }));
    this.dist = 0; this.speed = 300;
    this.lanes = this.slots.map((s, i) => {
      const [x, y, w, h, rot] = rects[i];
      const c = this.add.container(x + w / 2, y + h / 2).setRotation(rot);
      const g = this.add.graphics();
      g.fillGradientStyle(0x8ee4ff, 0x8ee4ff, 0xc8f2ff, 0xc8f2ff, 1).fillRect(-w / 2, -h / 2, w, h);
      for (let k = 0; k < 4; k++) g.fillStyle(0xffffff, 0.8).fillEllipse(-w / 2 + rnd(0, w), -h / 2 + rnd(40, h * 0.5), rnd(120, 220), rnd(40, 70));
      g.fillStyle(0x7ed957, 1).fillRect(-w / 2, h / 2 - 70, w, 70);
      g.fillStyle(0x5cb83d, 1).fillRect(-w / 2, h / 2 - 70, w, 14);
      c.add(g);
      const pipes = this.add.graphics(); c.add(pipes);
      const bird = this.add.image(-w / 2 + w * 0.28, 0, 'bird_' + s.p).setDisplaySize(100, 86); c.add(bird);
      const sc = txt(this, 0, -h / 2 + 70, '0', 64, '#ffffff'); c.add(sc);
      if (this.isCpu(i)) c.add(this.add.image(w / 2 - 60, -h / 2 + 60, 'cpu').setDisplaySize(64, 64));
      const border = this.add.graphics().lineStyle(10, PCOL[s.p], 1).strokeRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10); c.add(border);
      return { c, x, y, w, h, pipes, bird, sc, by: 0, vy: 0, score: 0, dead: false, bx: -w / 2 + w * 0.28 };
    });
    this.input.on('pointerdown', p => {
      if (!this.running || this.ended) return;
      const i = this.lanes.findIndex(l => p.x >= l.x && p.x < l.x + l.w && p.y >= l.y && p.y < l.y + l.h);
      if (i >= 0 && !this.isCpu(i)) this.flap(i);
    });
    this.drawPipes();
  }
  flap(i) {
    const L = this.lanes[i]; if (L.dead) return;
    L.vy = -820; audio.play('jump', { volume: 0.5, rate: 1.1 }); if (!this.isCpu(i)) haptics.tap();
  }
  pipeX(L, p) { return L.bx + (p.d - this.dist); }
  cpu(i, dt) {
    const L = this.lanes[i];
    const next = this.course.find(p => this.pipeX(L, p) + 70 > L.bx - 40);
    const gapH = this.gapH(L);
    const target = next ? (next.gy - 0.5) * (L.h - 70 - gapH) + 40 : 0;
    L.err ??= rnd(-40, 40);
    if (L.by > target + L.err && L.vy > -120) { this.flap(i); L.err = rnd(-50, 60); }
  }
  gapH(L) { return Math.max(250, 330 - this.dist / 400); }
  drawPipes() {
    this.lanes.forEach(L => {
      const g = L.pipes; g.clear();
      const gh = this.gapH(L), top = -L.h / 2, bot = L.h / 2 - 70;
      this.course.forEach(p => {
        const x = this.pipeX(L, p);
        if (x < -L.w / 2 - 140 || x > L.w / 2 + 140) return;
        const gc = (p.gy - 0.5) * (bot - top - gh) + (top + bot) / 2;
        const pw = 120;
        const draw = (y1, y2, capY) => {
          g.fillStyle(C.outline, 1).fillRect(x - pw / 2 - 6, y1, pw + 12, y2 - y1);
          g.fillStyle(0x2fd27a, 1).fillRect(x - pw / 2, y1, pw, y2 - y1);
          g.fillStyle(0xffffff, 0.3).fillRect(x - pw / 2 + 10, y1, 18, y2 - y1);
          g.fillStyle(C.outline, 1).fillRoundedRect(x - pw / 2 - 18, capY - 26, pw + 36, 52, 10);
          g.fillStyle(0x3ae68a, 1).fillRoundedRect(x - pw / 2 - 12, capY - 20, pw + 24, 40, 8);
        };
        draw(top, gc - gh / 2, gc - gh / 2 - 20);
        draw(gc + gh / 2, bot, gc + gh / 2 + 20);
        p.gc = gc;
      });
    });
  }
  tick(dt) {
    this.speed = Math.min(520, this.speed + dt * 6);
    this.dist += this.speed * dt;
    const dying = [];
    this.lanes.forEach((L, i) => {
      if (L.dead) return;
      L.vy += 2300 * dt; L.by += L.vy * dt;
      L.bird.setPosition(L.bx, L.by).setRotation(clamp(L.vy / 1400, -0.5, 1));
      const top = -L.h / 2, bot = L.h / 2 - 70, gh = this.gapH(L);
      let hit = L.by > bot - 36 || L.by < top + 20;
      this.course.forEach(p => {
        const x = this.pipeX(L, p);
        if (Math.abs(x - L.bx) < 60 + 40) {
          const gc = (p.gy - 0.5) * (bot - top - gh) + (top + bot) / 2;
          if (L.by - 34 < gc - gh / 2 || L.by + 34 > gc + gh / 2) hit = true;
        }
        if (!p['s' + i] && x < L.bx - 60) { p['s' + i] = true; L.score++; L.sc.setText(String(L.score)); audio.play('point', { volume: 0.4 }); }
      });
      if (hit) dying.push(i);
    });
    dying.forEach(i => {
      const L = this.lanes[i]; L.dead = true;
      L.bird.setTexture('bird_' + this.slots[i].p).setTint(0x888888);
      this.tweens.add({ targets: L.bird, angle: 540, y: L.h / 2 - 80, duration: 700, ease: 'Quad.easeIn' });
      const fl = this.add.rectangle(L.x + L.w / 2, L.y + L.h / 2, L.w, L.h, 0xffffff, 0.6).setDepth(10);
      this.tweens.add({ targets: fl, alpha: 0, duration: 250, onComplete: () => fl.destroy() });
      this.eliminate(i, { sound: 'hit', silentCheck: true });
    });
    if (dying.length) {
      const al = this.aliveList();
      if (al.length === 1) this.time.delayedCall(500, () => this.endRound(al[0]));
      else if (al.length === 0) this.time.delayedCall(500, () => this.endRound(dying.length < this.n ? dying : -1));
    }
    this.drawPipes();
  }
}

// ---------------------------------------------------------------- Sword duel (2P): tap = attack, hold = guard
export class Sword extends BaseGame {
  constructor() { super('sword'); }
  setup() {
    const { W, cx, cy } = this;
    this.bg(0x6a3093, 0x1a0a33);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3).fillEllipse(cx, cy + 20, 900, 1300);
    g.fillStyle(0x4a2a6a, 1).fillEllipse(cx, cy, 900, 1300);
    g.lineStyle(10, 0xb48cff, 0.5).strokeEllipse(cx, cy, 900, 1300);
    g.lineStyle(6, 0xffffff, 0.15).lineBetween(cx - 400, cy, cx + 400, cy);
    this.vignette();
    this.f = [0, 1].map(i => {
      const y = i === 0 ? cy + 300 : cy - 300, rot = i === 0 ? 0 : Math.PI;
      const c = this.add.container(cx, y).setRotation(rot).setDepth(5);
      const body0 = this.add.image(0, 0, 'char_' + this.slots[i].p).setDisplaySize(220, 220);
      const sword = this.add.container(90, -20);
      const sg = this.add.graphics();
      sg.fillStyle(C.outline, 1).fillRoundedRect(-14, -230, 28, 220, 10); sg.fillStyle(0xe6ecf5, 1).fillRoundedRect(-8, -224, 16, 214, 6);
      sg.fillStyle(0xffffff, 1).fillRect(-3, -220, 4, 200);
      sg.fillStyle(C.outline, 1).fillRoundedRect(-44, -18, 88, 26, 10); sg.fillStyle(0xffc93c, 1).fillRoundedRect(-38, -13, 76, 16, 6);
      sg.fillStyle(C.outline, 1).fillRoundedRect(-12, 4, 24, 54, 8); sg.fillStyle(0x9b5b34, 1).fillRoundedRect(-7, 8, 14, 46, 5);
      sword.add(sg);
      const shield = this.add.graphics();
      shield.fillStyle(C.outline, 1).fillEllipse(0, -150, 300, 90); shield.fillStyle(0x00d1ff, 0.6).fillEllipse(0, -150, 284, 76); shield.setVisible(false);
      c.add([shield, body0, sword]);
      const hearts = this.add.container(-200, 120);
      c.add(hearts);
      const stam = this.add.graphics(); c.add(stam);
      return { i, c, body: body0, sword, shield, hearts, stam, hp: 3, state: 'idle', t: 0, held: 0, stamina: 1, broken: 0 };
    });
    this.f.forEach(f => this.drawHearts(f));
  }
  drawHearts(f) {
    f.hearts.removeAll(true);
    for (let k = 0; k < 3; k++) f.hearts.add(txt(this, k * 70, 0, '♥', 70, k < f.hp ? '#ff4d5e' : '#3a2a50'));
  }
  onDown(i) { const f = this.f[i]; f.held = 0.0001; }
  onUp(i) {
    const f = this.f[i];
    const tap = f.held > 0 && f.held < 0.18;
    f.held = 0;
    if (f.state === 'guard') { f.state = 'idle'; f.shield.setVisible(false); }
    if (tap && f.state === 'idle') this.attack(f);
  }
  attack(f) {
    f.state = 'windup'; f.t = 0.3;
    audio.play('charge', { volume: 0.4, rate: 1.6 });
    this.tweens.add({ targets: f.sword, angle: -50, y: -60, duration: 280, ease: 'Back.easeIn' });
    f.body.setTint(0xffcccc);
  }
  strike(f) {
    const o = this.f[1 - f.i];
    f.state = 'recover'; f.t = 0.35; f.body.clearTint();
    this.tweens.add({ targets: f.sword, angle: 40, y: -20, x: 40, duration: 90, yoyo: true, onComplete: () => { f.sword.angle = 0; f.sword.x = 90; } });
    this.tweens.add({ targets: f.c, y: f.c.y + (f.i === 0 ? -80 : 80), duration: 90, yoyo: true });
    if (o.state === 'guard') {
      audio.play('hit', { rate: 1.6 }); this.burst(this.cx, this.cy, 0x00d1ff, 24); this.shake(120, 0.008);
      f.state = 'stun'; f.t = 0.8;
      this.floatText(this.cx, this.cy + (o.i === 0 ? 120 : -120), 'TANGKIS!', '#00d1ff', 60, o.i === 0 ? 0 : Math.PI);
      f.body.setTint(0x8888aa);
      o.stamina = Math.min(1, o.stamina + 0.25);
    } else {
      o.hp--; this.drawHearts(o);
      audio.play('punch'); audio.play('hit');
      this.shake(220, 0.015); this.burst(o.c.x, o.c.y, 0xff4d5e, 30);
      o.body.setTint(0xff6666); this.time.delayedCall(150, () => o.body.clearTint());
      this.tweens.add({ targets: o.c, y: o.c.y + (o.i === 0 ? 50 : -50), duration: 120, yoyo: true });
      if (o.state === 'windup') { o.state = 'idle'; this.tweens.add({ targets: o.sword, angle: 0, y: -20, duration: 120 }); o.body.clearTint(); }
      if (!this.isCpu(o.i)) haptics.heavy();
      if (o.hp <= 0) { o.body.setTexture('charO_' + this.slots[o.i].p); this.endRound(f.i); }
    }
  }
  cpu(i, dt) {
    const f = this.f[i], o = this.f[1 - i];
    f.think = (f.think || 0) - dt;
    if (o.state === 'windup' && f.state !== 'windup') {
      if (!f.decided) { f.decided = true; f.willGuard = Math.random() < 0.68; f.react = rnd(0.06, 0.2); }
      if (f.willGuard && 0.3 - o.t > f.react && !this.down[i]) this.setDown(i, true);
      return;
    }
    f.decided = false;
    if (this.down[i] && o.state !== 'windup') { this.setDown(i, false); return; }
    if (f.state === 'idle' && f.think <= 0) {
      f.think = rnd(0.5, 1.4);
      if (o.state === 'stun' || Math.random() < 0.55) this.cpuTap(i, 60);
    }
  }
  tick(dt) {
    this.f.forEach((f, i) => {
      if (this.down[i] && f.held > 0) {
        f.held += dt;
        if (f.held >= 0.18 && f.state === 'idle' && f.broken <= 0 && f.stamina > 0) { f.state = 'guard'; f.shield.setVisible(true); audio.play('select', { volume: 0.4 }); }
      }
      if (f.state === 'guard') { f.stamina -= dt * 0.55; if (f.stamina <= 0) { f.stamina = 0; f.state = 'idle'; f.broken = 1.2; f.shield.setVisible(false); audio.play('break'); this.floatText(f.c.x, f.c.y - (i ? -160 : 160), 'PERISAI PECAH!', '#ff6b35', 44, i ? Math.PI : 0); } }
      else f.stamina = Math.min(1, f.stamina + dt * 0.3);
      f.broken -= dt;
      if (f.state === 'windup' || f.state === 'stun' || f.state === 'recover') {
        f.t -= dt;
        if (f.t <= 0) { if (f.state === 'windup') this.strike(f); else { f.state = 'idle'; f.body.clearTint(); } }
      }
      f.stam.clear();
      f.stam.fillStyle(C.outline, 1).fillRoundedRect(-120, 170, 240, 24, 12);
      f.stam.fillStyle(f.broken > 0 ? 0xff4d5e : 0x00d1ff, 1).fillRoundedRect(-116, 174, 232 * f.stamina, 16, 8);
    });
  }
}
