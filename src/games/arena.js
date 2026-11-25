import Phaser from 'phaser';
import BaseGame, { TAU, rnd, irnd, clamp, angDiff } from './BaseGame.js';
import { C, txt, body } from '../theme.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';

// A round character that spins its aim arrow and dashes on tap.
class Mover {
  constructor(sc, i, x, y, r = 62, spin = 2.8) {
    this.sc = sc; this.i = i; this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.r = r;
    this.ang = Math.atan2(sc.cy - y, sc.cx - x);
    this.spin = (i % 2 ? -1 : 1) * spin;
    this.cd = 0; this.stun = 0;
    this.shadow = sc.add.ellipse(x, y + r * 0.7, r * 1.7, r * 0.6, 0x000000, 0.3).setDepth(4);
    this.arrow = sc.add.graphics().setDepth(5);
    this.spr = sc.add.image(x, y, 'char_' + sc.slots[i].p).setDisplaySize(r * 2, r * 2).setDepth(6);
    sc.tweens.add({ targets: this.spr, scaleY: this.spr.scaleY * 0.94, duration: 380 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  get speed() { return Math.hypot(this.vx, this.vy); }
  dash(power = 980) {
    if (this.cd > 0 || this.stun > 0) return false;
    this.vx += Math.cos(this.ang) * power; this.vy += Math.sin(this.ang) * power;
    this.cd = 0.42;
    audio.playVaried('dash');
    this.sc.tweens.add({ targets: this.spr, scaleX: { from: this.spr.scaleX * 1.25, to: this.spr.scaleX }, duration: 260, ease: 'Back.easeOut' });
    return true;
  }
  step(dt, friction = 0.16) {
    if (this.stun > 0) this.stun -= dt; else this.ang += this.spin * dt;
    this.cd -= dt;
    const f = Math.pow(friction, dt);
    this.vx *= f; this.vy *= f;
    this.x += this.vx * dt; this.y += this.vy * dt;
  }
  draw() {
    this.spr.setPosition(this.x, this.y);
    this.shadow.setPosition(this.x, this.y + this.r * 0.75);
    const g = this.arrow; g.clear();
    if (this.stun > 0) return;
    const a = this.ang, d = this.r + 26, ready = this.cd <= 0;
    const tx = this.x + Math.cos(a) * (d + 30), ty = this.y + Math.sin(a) * (d + 30);
    const lx = this.x + Math.cos(a + 0.32) * d, ly = this.y + Math.sin(a + 0.32) * d;
    const rx = this.x + Math.cos(a - 0.32) * d, ry = this.y + Math.sin(a - 0.32) * d;
    g.fillStyle(C.outline, 1).fillTriangle(tx + Math.cos(a) * 6, ty + Math.sin(a) * 6, lx + Math.cos(a + 1.6) * 5, ly + Math.sin(a + 1.6) * 5, rx + Math.cos(a - 1.6) * 5, ry + Math.sin(a - 1.6) * 5);
    g.fillStyle(ready ? this.sc.col(this.i) : 0x8f86aa, 1).fillTriangle(tx, ty, lx, ly, rx, ry);
  }
  destroy() { this.spr.destroy(); this.arrow.destroy(); this.shadow.destroy(); }
}

function collide(a, b, bounce = 1.25, sc) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
  if (d >= min || d === 0) return false;
  const nx = dx / d, ny = dy / d, ov = (min - d) / 2;
  const ma = a.m || 1, mb = b.m || 1;
  a.x -= nx * ov * (mb / (ma + mb)) * 2; a.y -= ny * ov * (mb / (ma + mb)) * 2;
  b.x += nx * ov * (ma / (ma + mb)) * 2; b.y += ny * ov * (ma / (ma + mb)) * 2;
  const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rv < 0) {
    const j = -(1 + bounce) * rv / (1 / ma + 1 / mb);
    a.vx -= j * nx / ma; a.vy -= j * ny / ma; b.vx += j * nx / mb; b.vy += j * ny / mb;
    if (sc && -rv > 250) {
      audio.play('thud', { volume: clamp(-rv / 1200, 0.3, 1) });
      sc.burst((a.x + b.x) / 2, (a.y + b.y) / 2, 0xffffff, 6);
      if (-rv > 700) sc.shake(90, 0.006);
    }
  }
  return true;
}

function aimCpu(sc, m, tx, ty, tol = 0.22) {
  const want = Math.atan2(ty - m.y, tx - m.x);
  return Math.abs(angDiff(m.ang, want)) < tol;
}

// ---------------------------------------------------------------- Sumo
export class Sumo extends BaseGame {
  constructor() { super('sumo'); }
  setup() {
    this.bg(0x4a1f2e, 0x140b2b);
    const R = this.R = Math.min(this.W * 0.45, (this.bottom - this.top) / 2 - 10);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35).fillCircle(this.cx, this.cy + 24, R + 40);
    g.fillStyle(0x8a5a32, 1).fillCircle(this.cx, this.cy, R + 40);
    g.fillStyle(0xd9b27a, 1).fillCircle(this.cx, this.cy, R + 26);
    g.fillStyle(0xf2dcae, 1).fillCircle(this.cx, this.cy, R);
    g.lineStyle(14, 0xc7965a, 1).strokeCircle(this.cx, this.cy, R - 4);
    g.lineStyle(10, 0xffffff, 0.9);
    g.lineBetween(this.cx - 60, this.cy - 50, this.cx + 60, this.cy - 50);
    g.lineBetween(this.cx - 60, this.cy + 50, this.cx + 60, this.cy + 50);
    for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; g.fillStyle(0xb98a52, 0.5).fillCircle(this.cx + Math.cos(a) * (R + 13), this.cy + Math.sin(a) * (R + 13), 5); }
    this.vignette();
    this.ms = this.slots.map((s, i) => {
      const a = this.seatAngle(i);
      return new Mover(this, i, this.cx + Math.cos(a) * R * 0.6, this.cy + Math.sin(a) * R * 0.6);
    });
    this.ms.forEach(m => m.draw());
  }
  onDown(i) { this.ms[i].dash(); }
  cpu(i, dt) {
    const m = this.ms[i];
    if (m.cd > 0) return;
    const dc = Math.hypot(m.x - this.cx, m.y - this.cy);
    if (dc > this.R * 0.68 && aimCpu(this, m, this.cx, this.cy, 0.5)) { m.dash(); return; }
    let best = null, bd = 1e9;
    this.ms.forEach((o, k) => { if (k !== i && this.alive[k]) { const d = Math.hypot(o.x - m.x, o.y - m.y); if (d < bd) { bd = d; best = o; } } });
    if (!best) return;
    const fx = m.x + Math.cos(m.ang) * 260, fy = m.y + Math.sin(m.ang) * 260;
    if (Math.hypot(fx - this.cx, fy - this.cy) > this.R * 0.9 && bd > 200) return;
    if (aimCpu(this, m, best.x, best.y, 0.2) && Math.random() < dt * 9) m.dash();
  }
  tick(dt) {
    const live = this.ms.filter((m, i) => this.alive[i]);
    live.forEach(m => m.step(dt));
    for (let a = 0; a < live.length; a++) for (let b = a + 1; b < live.length; b++) collide(live[a], live[b], 1.3, this);
    this.ms.forEach((m, i) => {
      if (!this.alive[i]) return;
      m.draw();
      if (Math.hypot(m.x - this.cx, m.y - this.cy) > this.R + m.r * 0.3) {
        this.eliminate(i);
        m.arrow.clear();
        audio.play('slide');
        this.tweens.add({ targets: [m.spr, m.shadow], scale: 0.1, alpha: 0, x: m.x + m.vx * 0.4, y: m.y + m.vy * 0.4, angle: 360, duration: 600, ease: 'Cubic.easeIn' });
        this.shake(200, 0.01);
      }
    });
  }
}

// ---------------------------------------------------------------- Coins
export class Coins extends BaseGame {
  constructor() { super('coins'); }
  setup() {
    this.bg(0x2b3a7a, 0x140b2b);
    const R = this.R = Math.min(this.W * 0.45, (this.bottom - this.top) / 2 - 10);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35).fillCircle(this.cx, this.cy + 24, R + 30);
    g.fillStyle(C.outline, 1).fillCircle(this.cx, this.cy, R + 30);
    g.fillStyle(0x4a3c9a, 1).fillCircle(this.cx, this.cy, R + 18);
    g.fillStyle(0x6a5acd, 1).fillCircle(this.cx, this.cy, R);
    for (let k = 1; k < 5; k++) g.lineStyle(4, 0xffffff, 0.06).strokeCircle(this.cx, this.cy, R * k / 5);
    this.vignette();
    this.target = 6;
    this.score = this.slots.map(() => 0);
    this.ms = this.slots.map((s, i) => {
      const a = this.seatAngle(i);
      const m = new Mover(this, i, this.cx + Math.cos(a) * R * 0.6, this.cy + Math.sin(a) * R * 0.6, 56);
      m.lbl = txt(this, m.x, m.y - 90, '0', 56, this.css(i)).setDepth(8);
      return m;
    });
    this.items = [];
    this.spawnT = 0;
    this.ms.forEach(m => m.draw());
  }
  onStart() { for (let k = 0; k < 3; k++) this.spawn(false); }
  spawn(bomb) {
    let x, y, tries = 0;
    do { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * this.R * 0.8; x = this.cx + Math.cos(a) * r; y = this.cy + Math.sin(a) * r; tries++; }
    while (tries < 20 && this.ms.some(m => Math.hypot(m.x - x, m.y - y) < 160));
    const s = this.add.image(x, y, bomb ? 'bomb' : 'coin').setDisplaySize(bomb ? 80 : 70, bomb ? 92 : 70).setDepth(5);
    const sy = s.scaleY;
    s.setScale(0); this.tweens.add({ targets: s, scaleX: sy, scaleY: sy, duration: 300, ease: 'Back.easeOut' });
    if (!bomb) this.tweens.add({ targets: s, y: y - 10, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.items.push({ s, x, y, bomb, life: bomb ? 7 : 99 });
  }
  onDown(i) { this.ms[i].dash(900); }
  cpu(i, dt) {
    const m = this.ms[i]; if (m.cd > 0 || m.stun > 0) return;
    let best = null, bd = 1e9;
    this.items.forEach(it => { if (!it.bomb) { const d = Math.hypot(it.x - m.x, it.y - m.y); if (d < bd) { bd = d; best = it; } } });
    const dc = Math.hypot(m.x - this.cx, m.y - this.cy);
    if (dc > this.R * 0.8 && aimCpu(this, m, this.cx, this.cy, 0.5)) { m.dash(700); return; }
    if (best && aimCpu(this, m, best.x, best.y, 0.18) && Math.random() < dt * 7) m.dash(Math.min(900, 300 + bd * 1.4));
  }
  tick(dt) {
    this.ms.forEach(m => m.step(dt, 0.12));
    for (let a = 0; a < this.n; a++) for (let b = a + 1; b < this.n; b++) collide(this.ms[a], this.ms[b], 1.1, this);
    this.ms.forEach((m, i) => {
      const dx = m.x - this.cx, dy = m.y - this.cy, d = Math.hypot(dx, dy), lim = this.R - m.r;
      if (d > lim) {
        const nx = dx / d, ny = dy / d; m.x = this.cx + nx * lim; m.y = this.cy + ny * lim;
        const vn = m.vx * nx + m.vy * ny; if (vn > 0) { m.vx -= 1.8 * vn * nx; m.vy -= 1.8 * vn * ny; if (vn > 300) audio.play('bounce', { volume: 0.5 }); }
      }
      m.draw(); m.lbl.setPosition(m.x, m.y - 92);
      for (const it of this.items) {
        if (it.dead) continue;
        if (Math.hypot(it.x - m.x, it.y - m.y) < m.r + 30) {
          it.dead = true;
          if (it.bomb) {
            this.score[i] = Math.max(0, this.score[i] - 2); m.stun = 1.2; m.vx *= -0.5; m.vy *= -0.5;
            audio.play('boom'); this.shake(220, 0.012); this.burst(it.x, it.y, 0xff6b35, 30);
            this.floatText(m.x, m.y - 60, '-2', '#ff4d5e');
            if (!this.isCpu(i)) haptics.heavy();
          } else {
            this.score[i]++;
            audio.play('point', { rate: 1 + this.score[i] * 0.05 });
            this.burst(it.x, it.y, 0xffd23f, 14);
            this.floatText(m.x, m.y - 60, '+1', '#ffd23f');
            if (!this.isCpu(i)) haptics.light();
          }
          m.lbl.setText(String(this.score[i]));
          this.tweens.add({ targets: m.lbl, scale: { from: 1.5, to: 1 }, duration: 250 });
          this.tweens.killTweensOf(it.s);
          this.tweens.add({ targets: it.s, scale: 0, duration: 160, onComplete: () => it.s.destroy() });
          if (this.score[i] >= this.target) { this.endRound(i); return; }
        }
      }
    });
    this.items = this.items.filter(it => {
      if (it.dead) return false;
      it.life -= dt;
      if (it.life <= 0) { it.s.destroy(); return false; }
      return true;
    });
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 0.9;
      const coins = this.items.filter(it => !it.bomb).length;
      if (coins < 4) this.spawn(false);
      if (Math.random() < 0.35 && this.items.filter(it => it.bomb).length < 2) this.spawn(true);
    }
  }
}

// ---------------------------------------------------------------- Soccer
export class Soccer extends BaseGame {
  constructor() { super('soccer'); }
  setup() {
    const { W, cx, cy } = this;
    this.bg(0x1f7a35, 0x0f4a22);
    const pw = this.pw = W * 0.92, top = this.pt = this.top + 10, bot = this.pb = this.bottom - 10;
    this.pl = cx - pw / 2; this.pr = cx + pw / 2;
    const g = this.add.graphics();
    for (let k = 0; k < 10; k++) { g.fillStyle(k % 2 ? 0x2f9a48 : 0x29903f, 1).fillRect(this.pl, top + (bot - top) * k / 10, pw, (bot - top) / 10 + 1); }
    g.lineStyle(8, 0xffffff, 0.85).strokeRect(this.pl, top, pw, bot - top);
    g.lineBetween(this.pl, cy, this.pr, cy); g.strokeCircle(cx, cy, 120);
    this.gw = 340;
    g.strokeRect(cx - 230, top, 460, 160); g.strokeRect(cx - 230, bot - 160, 460, 160);
    // goals
    g.fillStyle(0xffffff, 0.25).fillRect(cx - this.gw / 2, top - 60, this.gw, 60).fillRect(cx - this.gw / 2, bot, this.gw, 60);
    g.lineStyle(10, 0xffffff, 1).strokeRect(cx - this.gw / 2, top - 60, this.gw, 60).strokeRect(cx - this.gw / 2, bot, this.gw, 60);
    this.vignette();
    this.ms = this.slots.map((s, i) => {
      const team = this.teamOf(i);
      const side = team === 0 ? 1 : -1;
      const x = this.n <= 2 ? cx : cx + (i === 0 || i === 2 ? -180 : 180);
      const m = new Mover(this, i, x, cy + side * (bot - top) * 0.28, 54, 3.1);
      m.ang = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      return m;
    });
    this.ball = { x: cx, y: cy, vx: 0, vy: 0, r: 34, m: 0.45 };
    this.ballS = this.add.image(cx, cy, 'ball').setDisplaySize(68, 68).setDepth(7);
    this.ballSh = this.add.ellipse(cx, cy + 26, 60, 20, 0, 0.3).setDepth(4);
    this.ms.forEach(m => m.draw());
  }
  onDown(i) { this.ms[i].dash(920); }
  cpu(i, dt) {
    const m = this.ms[i], b = this.ball; if (m.cd > 0) return;
    const team = this.teamOf(i);
    const goalY = team === 0 ? this.pt - 40 : this.pb + 40; // attack this goal
    // aim at a point behind the ball relative to the goal
    const gx = this.cx - b.x, gy = goalY - b.y, gl = Math.hypot(gx, gy);
    const px = b.x - gx / gl * 50, py = b.y - gy / gl * 50;
    const d = Math.hypot(px - m.x, py - m.y);
    if (aimCpu(this, m, d < 160 ? b.x : px, d < 160 ? b.y : py, 0.22) && Math.random() < dt * 8) m.dash();
  }
  walls(o, bounce = 0.9) {
    const r = o.r;
    if (o.x < this.pl + r) { o.x = this.pl + r; o.vx = Math.abs(o.vx) * bounce; }
    if (o.x > this.pr - r) { o.x = this.pr - r; o.vx = -Math.abs(o.vx) * bounce; }
    const inMouth = Math.abs(o.x - this.cx) < this.gw / 2 - r;
    if (!(o === this.ball && inMouth)) {
      if (o.y < this.pt + r) { o.y = this.pt + r; o.vy = Math.abs(o.vy) * bounce; }
      if (o.y > this.pb - r) { o.y = this.pb - r; o.vy = -Math.abs(o.vy) * bounce; }
    }
  }
  tick(dt) {
    this.ms.forEach(m => { m.step(dt, 0.14); this.walls(m, 0.6); });
    for (let a = 0; a < this.n; a++) for (let b = a + 1; b < this.n; b++) collide(this.ms[a], this.ms[b], 1, this);
    const b = this.ball;
    this.ms.forEach(m => { if (collide(m, b, 0.9)) { const sp = Math.hypot(b.vx, b.vy); if (sp > 200) { audio.play('punch', { volume: 0.6 }); } } });
    const f = Math.pow(0.45, dt); b.vx *= f; b.vy *= f;
    const sp = Math.hypot(b.vx, b.vy); if (sp > 2200) { b.vx *= 2200 / sp; b.vy *= 2200 / sp; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    const before = [b.vx, b.vy];
    this.walls(b, 0.85);
    if (before[0] !== b.vx || before[1] !== b.vy) if (sp > 300) audio.play('bounce', { volume: 0.4 });
    this.ballS.setPosition(b.x, b.y).rotation += b.vx * dt * 0.02;
    this.ballSh.setPosition(b.x, b.y + 28);
    this.ms.forEach(m => m.draw());
    if (b.y < this.pt - 20 || b.y > this.pb + 20) {
      const scoringTeam = b.y < this.pt ? 0 : 1;
      b.vx = b.vy = 0;
      audio.play('win'); this.shake(300, 0.012);
      this.burst(b.x, b.y, 0xffffff, 40);
      const winners = this.slots.map((s, i) => this.teamOf(i) === scoringTeam ? i : -1).filter(i => i >= 0);
      this.endRound(winners.length ? winners : -1);
    }
  }
}

// ---------------------------------------------------------------- Meteor rain
export class Meteor extends BaseGame {
  constructor() { super('meteor'); }
  setup() {
    this.bg(0x5a2a3a, 0x1a0a20);
    const R = this.R = Math.min(this.W * 0.45, (this.bottom - this.top) / 2 - 10);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35).fillCircle(this.cx, this.cy + 24, R + 30);
    g.fillStyle(0x3a2030, 1).fillCircle(this.cx, this.cy, R + 30);
    g.fillStyle(0x8a5a4a, 1).fillCircle(this.cx, this.cy, R + 12);
    g.fillStyle(0xb07a5a, 1).fillCircle(this.cx, this.cy, R);
    for (let k = 0; k < 30; k++) { const a = rnd(0, TAU), r = rnd(0, R * 0.95); g.fillStyle(0x8a5a4a, 0.5).fillCircle(this.cx + Math.cos(a) * r, this.cy + Math.sin(a) * r, rnd(6, 22)); }
    this.vignette();
    this.ms = this.slots.map((s, i) => {
      const a = this.seatAngle(i);
      const m = new Mover(this, i, this.cx + Math.cos(a) * R * 0.55, this.cy + Math.sin(a) * R * 0.55, 48, 0);
      m.ang = a + Math.PI / 2; m.speed0 = 330;
      return m;
    });
    this.warns = []; this.spawnT = 1; this.level = 0;
    this.ms.forEach(m => m.draw());
  }
  onDown(i) { const m = this.ms[i]; m.ang += Math.PI / 2 * (i % 2 ? -1 : 1); audio.play('slide', { volume: 0.5 }); }
  cpu(i, dt) {
    const m = this.ms[i];
    m.cpuT = (m.cpuT || 0) - dt; if (m.cpuT > 0) return;
    const look = (a, dist) => { const x = m.x + Math.cos(a) * dist, y = m.y + Math.sin(a) * dist; let bad = Math.hypot(x - this.cx, y - this.cy) > this.R - 70; this.warns.forEach(w => { if (Math.hypot(w.x - x, w.y - y) < w.r + 40) bad = true; }); return bad; };
    if (look(m.ang, 120) || look(m.ang, 60)) { this.cpuTap(i); m.cpuT = 0.25 + rnd(0, 0.2); }
  }
  spawnWarn() {
    const al = this.aliveList();
    const tgt = this.ms[al[irnd(0, al.length - 1)]];
    const near = Math.random() < 0.6;
    const a = rnd(0, TAU), r = near ? rnd(0, 120) : rnd(0, this.R * 0.9);
    const x = near ? tgt.x + Math.cos(a) * r : this.cx + Math.cos(a) * r, y = near ? tgt.y + Math.sin(a) * r : this.cy + Math.sin(a) * r;
    const rr = rnd(90, 140 + this.level * 6);
    const ring = this.add.circle(x, y, rr, 0xff2e2e, 0.18).setStrokeStyle(6, 0xff4d4d, 0.9).setDepth(3);
    const fill = this.add.circle(x, y, 2, 0xff2e2e, 0.35).setDepth(3);
    const T = Math.max(0.8, 1.5 - this.level * 0.05);
    this.tweens.add({ targets: fill, radius: rr, duration: T * 1000 });
    const met = this.add.image(x + 300, y - 900, 'meteor').setDisplaySize(rr * 1.1, rr * 1.1).setDepth(12);
    this.tweens.add({ targets: met, x, y, duration: T * 1000, ease: 'Quad.easeIn' });
    this.warns.push({ x, y, r: rr, t: T, ring, fill, met });
  }
  tick(dt) {
    this.level += dt / 4;
    this.ms.forEach((m, i) => {
      if (!this.alive[i]) return;
      m.x += Math.cos(m.ang) * m.speed0 * dt; m.y += Math.sin(m.ang) * m.speed0 * dt;
      const dx = m.x - this.cx, dy = m.y - this.cy, d = Math.hypot(dx, dy), lim = this.R - m.r;
      if (d > lim) { m.x = this.cx + dx / d * lim; m.y = this.cy + dy / d * lim; m.ang = Math.atan2(-dy, -dx) + rnd(-0.6, 0.6); audio.play('bounce', { volume: 0.4 }); }
      m.draw();
    });
    for (let a = 0; a < this.n; a++) for (let b = a + 1; b < this.n; b++) if (this.alive[a] && this.alive[b]) collide(this.ms[a], this.ms[b], 0.2);
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = Math.max(0.35, 1.1 - this.level * 0.06); this.spawnWarn(); if (this.level > 6 && Math.random() < 0.4) this.spawnWarn(); }
    this.warns = this.warns.filter(w => {
      w.t -= dt;
      if (w.t > 0) return true;
      audio.play('smallboom'); this.shake(120, 0.008); this.burst(w.x, w.y, 0xff8a3c, 26);
      const crater = this.add.circle(w.x, w.y, w.r * 0.7, 0x3a2020, 0.5).setDepth(2);
      this.tweens.add({ targets: crater, alpha: 0, duration: 2500, onComplete: () => crater.destroy() });
      this.ms.forEach((m, i) => {
        if (this.alive[i] && Math.hypot(m.x - w.x, m.y - w.y) < w.r + m.r * 0.3) {
          this.eliminate(i); m.arrow.clear();
          m.spr.setTexture('charO_' + this.slots[i].p);
          this.tweens.add({ targets: [m.spr, m.shadow], alpha: 0, scale: 0.2, angle: 200, duration: 700 });
        }
      });
      w.ring.destroy(); w.fill.destroy(); w.met.destroy();
      return false;
    });
  }
}

// ---------------------------------------------------------------- Rotating bar jump
export class JumpBar extends BaseGame {
  constructor() { super('jump'); }
  setup() {
    this.bg(0x3a5a9a, 0x1a1a4a);
    const R = this.R = Math.min(this.W * 0.44, (this.bottom - this.top) / 2 - 20);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3).fillCircle(this.cx, this.cy + 26, R + 30);
    g.fillStyle(C.outline, 1).fillCircle(this.cx, this.cy, R + 30);
    g.fillStyle(0xffe9c2, 1).fillCircle(this.cx, this.cy, R + 18);
    g.fillStyle(0xffd18a, 1).fillCircle(this.cx, this.cy, R * 0.82);
    g.fillStyle(0xffe9c2, 1).fillCircle(this.cx, this.cy, R * 0.5);
    this.vignette();
    this.pr = R * 0.72;
    this.ps = this.slots.map((s, i) => {
      const a = this.seatAngle(i);
      const x = this.cx + Math.cos(a) * this.pr, y = this.cy + Math.sin(a) * this.pr;
      const sh = this.add.ellipse(x, y + 30, 100, 34, 0, 0.3).setDepth(4);
      const spr = this.add.image(x, y, 'char_' + s.p).setDisplaySize(104, 104).setDepth(8);
      return { a, x, y, sh, spr, air: 0, cd: 0 };
    });
    this.barA = rnd(0, TAU); this.barV = 1.6; this.dir = 1; this.flipT = rnd(4, 7); this.bars = 1;
    this.bar = this.add.graphics().setDepth(6);
    this.hub = this.add.circle(this.cx, this.cy, 46, 0x5d567a).setStrokeStyle(8, C.outline).setDepth(7);
    this.drawBar();
  }
  drawBar() {
    const g = this.bar; g.clear();
    for (let k = 0; k < this.bars; k++) {
      const a = this.barA + k * Math.PI;
      const L = this.R + 10;
      const x2 = this.cx + Math.cos(a) * L, y2 = this.cy + Math.sin(a) * L;
      g.lineStyle(48, C.outline, 1).lineBetween(this.cx, this.cy, x2, y2);
      g.lineStyle(34, 0xff4d5e, 1).lineBetween(this.cx, this.cy, x2, y2);
      g.lineStyle(10, 0xffffff, 0.35).lineBetween(this.cx + Math.cos(a + 0.05) * 40, this.cy + Math.sin(a + 0.05) * 40, this.cx + Math.cos(a + 0.02) * (L - 20), this.cy + Math.sin(a + 0.02) * (L - 20));
    }
  }
  onDown(i) {
    const p = this.ps[i]; if (p.air > 0 || p.cd > 0) return;
    p.air = 0.62; p.cd = 0.8; audio.play('jump');
    this.tweens.add({ targets: p.spr, scale: p.spr.scale * 1.45, duration: 310, yoyo: true, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: p.sh, scale: 0.6, alpha: 0.15, duration: 310, yoyo: true });
  }
  cpu(i, dt) {
    const p = this.ps[i];
    if (p.air > 0 || p.cd > 0) return;
    for (let k = 0; k < this.bars; k++) {
      const rel = angDiff(p.a, this.barA + k * Math.PI) * this.dir; // positive => bar approaching
      const tt = rel / this.barV;
      if (tt > 0 && tt < 0.25 + (p.err ??= rnd(-0.08, 0.12))) { this.cpuTap(i); p.err = rnd(-0.1, 0.12); }
    }
  }
  tick(dt) {
    this.barV += dt * 0.07;
    this.flipT -= dt;
    if (this.flipT <= 0) { this.dir *= -1; this.flipT = rnd(4, 8); this.floatText(this.cx, this.cy - 90, 'BALIK!', '#ffd23f', 50); audio.play('whoosh'); }
    if (this.t > 14 && this.bars === 1) { this.bars = 2; this.floatText(this.cx, this.cy + 90, 'DUA PALANG!', '#ff4d5e', 50); audio.play('charge'); }
    this.barA += this.barV * this.dir * dt;
    this.drawBar();
    this.ps.forEach((p, i) => {
      p.cd -= dt; p.air -= dt;
      if (!this.alive[i]) return;
      for (let k = 0; k < this.bars; k++) {
        if (Math.abs(angDiff(p.a, this.barA + k * Math.PI)) < 0.17 && p.air <= 0.06) {
          this.eliminate(i);
          this.burst(p.x, p.y, this.col(i), 24); this.shake(160, 0.01);
          p.spr.setTexture('charO_' + this.slots[i].p);
          const ox = Math.cos(p.a) * 700, oy = Math.sin(p.a) * 700;
          this.tweens.add({ targets: [p.spr, p.sh], x: '+=' + ox, y: '+=' + oy, angle: 540, alpha: 0, duration: 800, ease: 'Cubic.easeOut' });
        }
      }
    });
  }
}
