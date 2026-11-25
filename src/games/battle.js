import Phaser from 'phaser';
import BaseGame, { TAU, rnd, irnd, clamp, angDiff } from './BaseGame.js';
import { C, txt, body } from '../theme.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';

function circleRect(o, w) {
  const nx = clamp(o.x, w.x, w.x + w.w), ny = clamp(o.y, w.y, w.y + w.h);
  const dx = o.x - nx, dy = o.y - ny, d = Math.hypot(dx, dy);
  if (d < o.r) {
    if (d === 0) { o.y = w.y - o.r; return true; }
    o.x = nx + dx / d * o.r; o.y = ny + dy / d * o.r; return true;
  }
  return false;
}
const inRect = (x, y, w, pad = 0) => x > w.x - pad && x < w.x + w.w + pad && y > w.y - pad && y < w.y + w.h + pad;

// ---------------------------------------------------------------- Tanks (and spaceships)
export class Tanks extends BaseGame {
  constructor(key = 'tank') { super(key); this.space = key === 'ship'; }
  setup() {
    const { W, cx, cy } = this;
    const fx = 24, fy = this.top - 4, fw = W - 48, fh = this.bottom - this.top + 8;
    this.f = { x: fx, y: fy, w: fw, h: fh };
    if (this.space) this.bg(0x0e0a2b, 0x05030f); else this.bg(0x4d6b33, 0x2a3d1d);
    const g = this.add.graphics();
    if (this.space) {
      for (let k = 0; k < 120; k++) g.fillStyle(0xffffff, rnd(0.2, 0.9)).fillCircle(rnd(0, W), rnd(0, this.H), rnd(1, 3.2));
      g.lineStyle(6, 0x6a5acd, 0.6).strokeRoundedRect(fx, fy, fw, fh, 30);
      const neb = this.add.image(cx, cy, 'glow').setDisplaySize(W * 1.4, W * 1.4).setTint(0x7a2bff).setAlpha(0.25);
      this.walls = [];
      this.rocks = [];
      for (let k = 0; k < 3; k++) this.addRock(cx + rnd(-200, 200), cy + (k - 1) * 330, 70);
    } else {
      g.fillStyle(0x6d8f45, 1).fillRoundedRect(fx, fy, fw, fh, 24);
      for (let k = 0; k < 60; k++) g.fillStyle(0x5a7a38, 0.6).fillCircle(fx + rnd(0, fw), fy + rnd(0, fh), rnd(8, 30));
      g.lineStyle(10, C.outline, 1).strokeRoundedRect(fx, fy, fw, fh, 24);
      const bw = 70;
      const L = [
        { x: cx - 140, y: cy - bw / 2, w: 280, h: bw },
        { x: fx + 150, y: fy + fh * 0.25, w: 220, h: bw }, { x: fx + fw - 370, y: fy + fh * 0.75 - bw, w: 220, h: bw },
        { x: fx + fw - 220, y: fy + fh * 0.25, w: bw, h: 220 }, { x: fx + 150, y: fy + fh * 0.75 - 220, w: bw, h: 220 }
      ];
      this.walls = L;
      L.forEach(w => {
        g.fillStyle(0x000000, 0.3).fillRoundedRect(w.x + 8, w.y + 14, w.w, w.h, 14);
        g.fillStyle(C.outline, 1).fillRoundedRect(w.x - 5, w.y - 5, w.w + 10, w.h + 10, 16);
        g.fillStyle(0xa0703a, 1).fillRoundedRect(w.x, w.y, w.w, w.h, 12);
        g.fillStyle(0xc89058, 1).fillRoundedRect(w.x + 6, w.y + 6, w.w - 12, w.h * 0.4, 8);
      });
    }
    this.vignette();
    this.tanks = this.slots.map((s, i) => {
      const a = this.seatAngle(i);
      const dist = Math.min(fw, fh) * 0.42;
      const t = { i, x: cx + Math.cos(a) * dist, y: cy + Math.sin(a) * dist * 1.25, ang: a + Math.PI, r: this.space ? 40 : 46, vx: 0, vy: 0, cd: 0, spin: (i % 2 ? -1 : 1) * 2.6 };
      t.x = clamp(t.x, fx + 80, fx + fw - 80); t.y = clamp(t.y, fy + 80, fy + fh - 80);
      t.spr = this.add.image(t.x, t.y, (this.space ? 'ship_' : 'tank_') + s.p).setDisplaySize(this.space ? 104 : 112, this.space ? 104 : 112).setDepth(6);
      t.aim = this.add.graphics().setDepth(5);
      return t;
    });
    this.bullets = [];
  }
  addRock(x, y, r) {
    const s = this.add.image(x, y, 'meteor').setDisplaySize(r * 2.1, r * 2.1).setDepth(5);
    this.rocks.push({ x, y, r, vx: rnd(-90, 90), vy: rnd(-90, 90), s, spin: rnd(-1, 1) });
  }
  onDown(i) {
    const t = this.tanks[i];
    if (t.cd > 0) return;
    if (this.bullets.filter(b => b.o === i).length >= 3) return;
    t.cd = 0.3;
    const sp = this.space ? 1000 : 760;
    const bx = t.x + Math.cos(t.ang) * (t.r + 14), by = t.y + Math.sin(t.ang) * (t.r + 14);
    const s = this.add.circle(bx, by, this.space ? 10 : 13, this.space ? this.col(i) : 0x2a2540).setStrokeStyle(5, this.space ? 0xffffff : this.col(i)).setDepth(7);
    this.bullets.push({ x: bx, y: by, vx: Math.cos(t.ang) * sp, vy: Math.sin(t.ang) * sp, o: i, life: this.space ? 1.6 : 3, bounces: this.space ? 0 : 2, s, safe: 0.12 });
    audio.playVaried(this.space ? 'laser' : 'shoot');
    t.spr.x -= Math.cos(t.ang) * 8;
    this.burst(bx, by, 0xffd23f, 5);
  }
  cpu(i, dt) {
    const t = this.tanks[i];
    t.ct = (t.ct || 0) - dt;
    if (this.down[i]) { if (t.ct <= 0) this.setDown(i, false); return; }
    if (t.ct > 0) return;
    let best = null, bd = 1e9;
    this.tanks.forEach((o, k) => { if (k !== i && this.alive[k]) { const d = Math.hypot(o.x - t.x, o.y - t.y); if (d < bd) { bd = d; best = o; } } });
    if (!best) return;
    const want = Math.atan2(best.y - t.y, best.x - t.x);
    if (Math.abs(angDiff(t.ang, want)) < 0.14) {
      // check line of sight to avoid wasting shots into a wall
      let blocked = false;
      for (let s = 0.15; s < 1; s += 0.1) { const x = t.x + (best.x - t.x) * s, y = t.y + (best.y - t.y) * s; if (this.walls.some(w => inRect(x, y, w, 6))) blocked = true; }
      if (!blocked || Math.random() < 0.15) { this.setDown(i, true); t.ct = bd > 450 ? rnd(0.3, 0.7) : rnd(0.05, 0.2); }
    }
  }
  tick(dt) {
    const f = this.f;
    this.tanks.forEach((t, i) => {
      if (!this.alive[i]) return;
      t.cd -= dt;
      if (this.down[i]) {
        if (this.space) { t.vx += Math.cos(t.ang) * 900 * dt; t.vy += Math.sin(t.ang) * 900 * dt; }
        else { t.x += Math.cos(t.ang) * 300 * dt; t.y += Math.sin(t.ang) * 300 * dt; }
      } else t.ang += t.spin * dt;
      if (this.space) {
        const fr = Math.pow(0.5, dt); t.vx *= fr; t.vy *= fr;
        const sp = Math.hypot(t.vx, t.vy); if (sp > 520) { t.vx *= 520 / sp; t.vy *= 520 / sp; }
        t.x += t.vx * dt; t.y += t.vy * dt;
        if (t.x < f.x) t.x += f.w; if (t.x > f.x + f.w) t.x -= f.w;
        if (t.y < f.y) t.y += f.h; if (t.y > f.y + f.h) t.y -= f.h;
      } else {
        t.x = clamp(t.x, f.x + t.r, f.x + f.w - t.r); t.y = clamp(t.y, f.y + t.r, f.y + f.h - t.r);
        this.walls.forEach(w => circleRect(t, w));
      }
    });
    for (let a = 0; a < this.n; a++) for (let b = a + 1; b < this.n; b++) {
      const A = this.tanks[a], B = this.tanks[b];
      if (!this.alive[a] || !this.alive[b]) continue;
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), m = A.r + B.r;
      if (d < m && d > 0) { const o = (m - d) / 2; A.x -= dx / d * o; A.y -= dy / d * o; B.x += dx / d * o; B.y += dy / d * o; }
    }
    if (this.rocks) this.rocks.forEach(r => {
      r.x += r.vx * dt; r.y += r.vy * dt; r.s.rotation += r.spin * dt;
      if (r.x < f.x + r.r || r.x > f.x + f.w - r.r) r.vx *= -1;
      if (r.y < f.y + r.r || r.y > f.y + f.h - r.r) r.vy *= -1;
      r.x = clamp(r.x, f.x + r.r, f.x + f.w - r.r); r.y = clamp(r.y, f.y + r.r, f.y + f.h - r.r);
      r.s.setPosition(r.x, r.y);
      this.tanks.forEach((t, i) => { if (this.alive[i] && Math.hypot(t.x - r.x, t.y - r.y) < t.r * 0.8 + r.r) this.kill(i); });
    });
    this.bullets = this.bullets.filter(b => {
      b.life -= dt; b.safe -= dt;
      b.x += b.vx * dt;
      if (!this.space && (b.x < f.x + 10 || b.x > f.x + f.w - 10 || this.walls.some(w => inRect(b.x, b.y, w)))) { b.x -= b.vx * dt; b.vx *= -1; b.bounces--; audio.play('bounce', { volume: 0.35 }); }
      b.y += b.vy * dt;
      if (!this.space && (b.y < f.y + 10 || b.y > f.y + f.h - 10 || this.walls.some(w => inRect(b.x, b.y, w)))) { b.y -= b.vy * dt; b.vy *= -1; b.bounces--; audio.play('bounce', { volume: 0.35 }); }
      if (this.space) { if (b.x < f.x) b.x += f.w; if (b.x > f.x + f.w) b.x -= f.w; if (b.y < f.y) b.y += f.h; if (b.y > f.y + f.h) b.y -= f.h; }
      let dead = b.life <= 0 || b.bounces < 0;
      if (this.rocks) this.rocks.forEach(r => { if (Math.hypot(b.x - r.x, b.y - r.y) < r.r) { dead = true; this.burst(b.x, b.y, 0xc4623a, 6); audio.play('break', { volume: 0.4 }); } });
      this.tanks.forEach((t, i) => {
        if (dead || !this.alive[i]) return;
        if (i === b.o && b.safe > 0) return;
        if (Math.hypot(t.x - b.x, t.y - b.y) < t.r + 8) { dead = true; this.kill(i); }
      });
      if (dead) { b.s.destroy(); return false; }
      b.s.setPosition(b.x, b.y);
      return true;
    });
    this.tanks.forEach((t, i) => {
      if (!this.alive[i]) return;
      t.spr.setPosition(t.spr.x + (t.x - t.spr.x) * 0.5, t.spr.y + (t.y - t.spr.y) * 0.5).setRotation(t.ang);
      t.aim.clear();
      if (!this.down[i]) {
        t.aim.lineStyle(6, this.col(i), 0.35);
        for (let k = 1; k < 5; k++) t.aim.strokePoints([{ x: t.x + Math.cos(t.ang) * (t.r + k * 34), y: t.y + Math.sin(t.ang) * (t.r + k * 34) }, { x: t.x + Math.cos(t.ang) * (t.r + k * 34 + 14), y: t.y + Math.sin(t.ang) * (t.r + k * 34 + 14) }]);
      }
    });
  }
  kill(i) {
    const t = this.tanks[i];
    this.eliminate(i, { sound: 'boom' });
    t.aim.clear();
    this.burst(t.x, t.y, 0xff8a3c, 40); this.burst(t.x, t.y, this.col(i), 20);
    this.shake(260, 0.014);
    const ring = this.add.circle(t.x, t.y, 20, 0xffd23f, 0.6).setDepth(8);
    this.tweens.add({ targets: ring, radius: 160, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
    t.spr.setTint(0x333333);
    this.tweens.add({ targets: t.spr, alpha: 0.35, scale: t.spr.scale * 0.8, duration: 400 });
  }
}
export class Ships extends Tanks { constructor() { super('ship'); } }

// ---------------------------------------------------------------- Curve snakes
export class Curve extends BaseGame {
  constructor() { super('snake'); }
  setup() {
    const { W } = this;
    this.bg(0x1a1240, 0x0a0620);
    const fx = 30, fy = this.top, fw = W - 60, fh = this.bottom - this.top;
    this.f = { x: fx, y: fy, w: fw, h: fh };
    const g = this.add.graphics();
    g.fillStyle(0x120c30, 1).fillRoundedRect(fx, fy, fw, fh, 26);
    for (let x = fx + 60; x < fx + fw; x += 60) g.lineStyle(2, 0xffffff, 0.04).lineBetween(x, fy, x, fy + fh);
    for (let y = fy + 60; y < fy + fh; y += 60) g.lineStyle(2, 0xffffff, 0.04).lineBetween(fx, y, fx + fw, y);
    g.lineStyle(10, 0x6a5acd, 1).strokeRoundedRect(fx, fy, fw, fh, 26);
    this.rt = this.add.renderTexture(0, 0, this.W, this.H).setOrigin(0).setDepth(3);
    this.cs = 10;
    this.gw = Math.ceil(fw / this.cs); this.gh = Math.ceil(fh / this.cs);
    this.owner = new Int8Array(this.gw * this.gh).fill(-1);
    this.when = new Float32Array(this.gw * this.gh);
    this.dotG = this.make.graphics({ add: false });
    this.sn = this.slots.map((s, i) => {
      const a = this.seatAngle(i);
      const x = this.cx + Math.cos(a) * fw * 0.32, y = this.cy + Math.sin(a) * fh * 0.3;
      const head = this.add.image(x, y, 'char_' + s.p).setDisplaySize(44, 44).setDepth(6);
      return { x, y, ang: a + Math.PI + rnd(-0.4, 0.4), gap: 0, gapT: rnd(1.5, 3), head, px: x, py: y };
    });
    this.speed = 230;
    this.dirArrows = this.sn.map((s, i) => {
      const ar = this.add.image(s.x + Math.cos(s.ang) * 60, s.y + Math.sin(s.ang) * 60, 'ic_next').setDisplaySize(50, 50).setTint(this.col(i)).setRotation(s.ang).setDepth(6);
      this.tweens.add({ targets: ar, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
      return ar;
    });
  }
  onStart() { this.dirArrows.forEach(a => a.destroy()); }
  cell(x, y) { const cx = Math.floor((x - this.f.x) / this.cs), cy = Math.floor((y - this.f.y) / this.cs); if (cx < 0 || cy < 0 || cx >= this.gw || cy >= this.gh) return -2; return cy * this.gw + cx; }
  blocked(x, y, self) {
    const c = this.cell(x, y); if (c === -2) return true;
    const o = this.owner[c]; if (o < 0) return false;
    return o !== self || this.t - this.when[c] > 0.45;
  }
  cpu(i, dt) {
    const s = this.sn[i];
    const look = (a, d) => this.blocked(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, i);
    let danger = false;
    for (const d of [30, 60, 95]) if (look(s.ang, d)) danger = true;
    let turnBad = false;
    for (const k of [0.5, 0.9, 1.4]) if (look(s.ang + k, 70)) turnBad = true;
    s.wander = (s.wander || 0) - dt;
    if (danger && !turnBad) this.setDown(i, true);
    else if (danger && turnBad) this.setDown(i, Math.random() < 0.5);
    else if (s.wander <= 0) { s.wander = rnd(0.4, 1.4); this.setDown(i, Math.random() < 0.3); }
    else if (!danger && this.down[i] && Math.random() < dt * 4) this.setDown(i, false);
  }
  tick(dt) {
    this.speed += dt * 4;
    const g = this.dotG;
    this.sn.forEach((s, i) => {
      if (!this.alive[i]) return;
      if (this.down[i]) s.ang += 3.3 * dt;
      s.gapT -= dt;
      if (s.gapT <= 0) { s.gap = 0.2; s.gapT = rnd(2, 3.6); }
      s.gap -= dt;
      const steps = Math.ceil(this.speed * dt / 4);
      for (let k = 0; k < steps; k++) {
        const nx = s.x + Math.cos(s.ang) * this.speed * dt / steps, ny = s.y + Math.sin(s.ang) * this.speed * dt / steps;
        const fx = nx + Math.cos(s.ang) * 12, fy = ny + Math.sin(s.ang) * 12;
        if (this.blocked(fx, fy, i)) { this.crash(i); return; }
        s.x = nx; s.y = ny;
        if (s.gap <= 0) {
          g.clear(); g.fillStyle(this.col(i), 1).fillCircle(s.x, s.y, 11);
          this.rt.draw(g, 0, 0);
          for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
            const c = this.cell(s.x + ox * 6, s.y + oy * 6);
            if (c >= 0 && this.owner[c] < 0) { this.owner[c] = i; this.when[c] = this.t; }
          }
        }
      }
      s.head.setPosition(s.x, s.y).setRotation(s.ang + Math.PI / 2);
    });
  }
  crash(i) {
    const s = this.sn[i];
    this.eliminate(i, { sound: 'smallboom' });
    this.burst(s.x, s.y, this.col(i), 30); this.shake(150, 0.01);
    s.head.setTexture('charO_' + this.slots[i].p);
    this.tweens.add({ targets: s.head, scale: s.head.scale * 1.8, duration: 200, yoyo: true });
  }
}

// ---------------------------------------------------------------- Knife throw
export class Knife extends BaseGame {
  constructor() { super('knife'); }
  setup() {
    this.bg(0x2a5fa8, 0x10204a);
    const R = this.R = 225;
    const glow = this.add.image(this.cx, this.cy, 'glow').setDisplaySize(900, 900).setAlpha(0.5);
    this.logC = this.add.container(this.cx, this.cy).setDepth(5);
    this.log = this.add.image(0, 0, 'log').setDisplaySize(R * 2 + 30, R * 2 + 30);
    this.logC.add(this.log);
    this.stuck = [];
    this.rot = 0; this.rv = 2.2; this.rvT = 0; this.rvTarget = 2.2;
    for (let k = 0; k < 2; k++) this.stick(rnd(0, TAU), -1);
    this.ps = this.slots.map((s, i) => {
      const a = this.seatAngle(i);
      const D = this.n <= 2 ? 520 : 560;
      const x = this.cx + Math.cos(a) * D, y = this.cy + Math.sin(a) * D;
      const kn = this.add.image(x, y, 'knife').setDisplaySize(40, 140).setRotation(a - Math.PI / 2).setDepth(6);
      const ring = this.add.circle(x, y, 80, this.col(i), 0.15).setStrokeStyle(6, this.col(i), 0.8).setDepth(4);
      const bar = this.add.graphics().setDepth(7);
      return { a, x, y, D, kn, ring, bar, cd: 0, idle: 0, fly: null };
    });
    this.vignette();
    this.thrown = 0;
  }
  stick(localA, owner) {
    const k = this.add.image(Math.cos(localA) * (this.R + 52), Math.sin(localA) * (this.R + 52), 'knife').setDisplaySize(34, 120).setRotation(localA - Math.PI / 2);
    this.logC.add(k);
    this.logC.sendToBack(k);
    this.stuck.push({ a: localA, owner, k });
  }
  throwK(i) {
    const p = this.ps[i];
    if (p.cd > 0 || p.fly) return;
    p.cd = 0.55; p.idle = 0;
    audio.play('dash');
    p.fly = { d: p.D };
    p.kn.setAlpha(1);
  }
  onDown(i) { this.throwK(i); }
  cpu(i, dt) {
    const p = this.ps[i]; if (p.cd > 0 || p.fly) return;
    const tFly = (p.D - this.R - 60) / 2600;
    const local = Phaser.Math.Angle.Wrap(p.a - (this.rot + this.rv * tFly));
    const safe = this.stuck.every(s => Math.abs(angDiff(s.a, local)) > 0.34);
    p.think = (p.think || 0) - dt;
    if (p.think <= 0) { p.think = rnd(0.05, 0.18); if ((safe && Math.random() < 0.55) || (!safe && Math.random() < 0.04)) this.throwK(i); }
  }
  tick(dt) {
    this.rvT -= dt;
    if (this.rvT <= 0) { this.rvT = rnd(1.2, 3); this.rvTarget = (Math.random() < 0.3 ? -1 : 1) * Math.sign(this.rvTarget || 1) * rnd(1.4, 3.4 + this.thrown * 0.04); }
    this.rv += (this.rvTarget - this.rv) * Math.min(1, dt * 2.5);
    this.rot += this.rv * dt;
    this.logC.setRotation(this.rot);
    this.ps.forEach((p, i) => {
      p.cd -= dt;
      if (!this.alive[i]) return;
      if (!p.fly) {
        p.idle += dt;
        const left = 1 - p.idle / 3.2;
        p.bar.clear();
        p.bar.fillStyle(C.outline, 1).fillRoundedRect(p.x - 70, p.y + (this.isTop(i) ? -110 : 92), 140, 20, 10);
        p.bar.fillStyle(left > 0.35 ? this.col(i) : 0xff2e2e, 1).fillRoundedRect(p.x - 66, p.y + (this.isTop(i) ? -106 : 96), 132 * Math.max(0, left), 12, 6);
        if (left <= 0) { this.floatText(p.x, p.y, 'WAKTU!', '#ff4d5e', 40, this.isTop(i) ? Math.PI : 0); this.throwK(i); }
        p.kn.setPosition(p.x, p.y).setAlpha(p.cd > 0 ? 0.3 : 1);
        return;
      }
      p.bar.clear();
      p.fly.d -= 2600 * dt;
      const d = Math.max(p.fly.d, this.R + 52);
      p.kn.setPosition(this.cx + Math.cos(p.a) * d, this.cy + Math.sin(p.a) * d);
      if (p.fly.d <= this.R + 52) {
        const local = Phaser.Math.Angle.Wrap(p.a - this.rot);
        const hit = this.stuck.find(s => Math.abs(angDiff(s.a, local)) < 0.2);
        p.fly = null; this.thrown++;
        if (hit) {
          audio.play('break'); this.shake(200, 0.012);
          this.burst(p.kn.x, p.kn.y, 0xffffff, 20);
          const k2 = this.add.image(p.kn.x, p.kn.y, 'knife').setDisplaySize(40, 140).setRotation(p.kn.rotation).setDepth(9);
          this.tweens.add({ targets: k2, x: k2.x + Math.cos(p.a) * 500, y: k2.y + Math.sin(p.a) * 500 + 300, angle: 720, alpha: 0, duration: 800, onComplete: () => k2.destroy() });
          p.kn.setVisible(false); p.ring.setAlpha(0.2);
          this.eliminate(i, { sound: 'hit' });
        } else {
          this.stick(local, i);
          audio.play('thud', { rate: 1.3 }); haptics.light();
          this.tweens.add({ targets: this.log, scale: { from: this.log.scale * 0.96, to: this.log.scale }, duration: 120 });
          this.burst(p.kn.x, p.kn.y, 0xd9a35b, 8);
          p.kn.setPosition(p.x, p.y);
        }
      }
    });
  }
}

// ---------------------------------------------------------------- Target shooting
export class Target extends BaseGame {
  constructor() { super('target'); }
  setup() {
    this.bg(0x2e7d3a, 0x123a1a);
    const g = this.add.graphics();
    for (let k = 0; k < 8; k++) g.lineStyle(3, 0xffffff, 0.05).strokeCircle(this.cx, this.cy, 80 + k * 90);
    this.vignette();
    this.goal = 5;
    this.score = this.slots.map(() => 0);
    this.tg = { x: this.cx, y: this.cy, r: 90, t: 0, sx: 0.7, sy: 0.9 };
    this.tgS = this.add.image(this.cx, this.cy, 'target').setDisplaySize(180, 180).setDepth(5);
    this.cans = this.slots.map((s, i) => {
      const a = this.seatAngle(i);
      const D = this.n <= 2 ? this.H / 2 - 330 : Math.hypot(this.W / 2 - 330, this.H / 2 - 330) * 0.9;
      const x = this.cx + Math.cos(a) * D, y = this.cy + Math.sin(a) * D;
      const base = this.add.circle(x, y, 72, this.dark(i)).setStrokeStyle(8, C.outline).setDepth(6);
      const barrel = this.add.rectangle(x, y, 160, 56, this.col(i)).setOrigin(0.1, 0.5).setStrokeStyle(8, C.outline).setDepth(5);
      const cap = this.add.circle(x, y, 44, this.col(i)).setStrokeStyle(6, C.outline).setDepth(7);
      const sc = txt(this, x, y, '0', 44, '#ffffff').setDepth(8).setRotation(this.isTop(i) ? Math.PI : 0);
      return { a0: a + Math.PI, x, y, ph: rnd(0, TAU), sp: rnd(1.6, 2.2), barrel, sc, cd: 0, ang: a + Math.PI };
    });
    this.balls = [];
  }
  onDown(i) {
    const c = this.cans[i]; if (c.cd > 0) return;
    c.cd = 0.45;
    const s = this.add.circle(c.x + Math.cos(c.ang) * 110, c.y + Math.sin(c.ang) * 110, 18, this.col(i)).setStrokeStyle(6, C.outline).setDepth(6);
    this.balls.push({ x: s.x, y: s.y, vx: Math.cos(c.ang) * 1700, vy: Math.sin(c.ang) * 1700, o: i, s });
    audio.playVaried('shoot');
    this.tweens.add({ targets: c.barrel, scaleX: { from: 0.75, to: 1 }, duration: 200 });
  }
  cpu(i, dt) {
    const c = this.cans[i]; if (c.cd > 0) return;
    const d = Math.hypot(this.tg.x - c.x, this.tg.y - c.y);
    const tt = d / 1700;
    const px = this.tg.x + (this.tg.vx || 0) * tt, py = this.tg.y + (this.tg.vy || 0) * tt;
    const want = Math.atan2(py - c.y, px - c.x);
    const tol = Math.atan2(this.tg.r * 0.6, d);
    if (Math.abs(angDiff(c.ang, want)) < tol && Math.random() < dt * 14) this.onDown(i);
  }
  tick(dt) {
    const tg = this.tg;
    tg.t += dt;
    const ox = tg.x, oy = tg.y;
    tg.x = this.cx + Math.sin(tg.t * tg.sx) * (this.W * 0.28);
    tg.y = this.cy + Math.sin(tg.t * tg.sy + 1) * ((this.bottom - this.top) * 0.18);
    tg.vx = (tg.x - ox) / dt; tg.vy = (tg.y - oy) / dt;
    this.tgS.setPosition(tg.x, tg.y);
    this.cans.forEach((c, i) => {
      c.cd -= dt; c.ph += c.sp * dt;
      c.ang = c.a0 + Math.sin(c.ph) * 0.75;
      c.barrel.setRotation(c.ang);
    });
    this.balls = this.balls.filter(b => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.s.setPosition(b.x, b.y);
      if (Math.hypot(b.x - tg.x, b.y - tg.y) < tg.r + 10) {
        const i = b.o;
        this.score[i]++;
        this.cans[i].sc.setText(String(this.score[i]));
        audio.play('point', { rate: 1 + this.score[i] * 0.06 }); this.burst(tg.x, tg.y, this.col(i), 28); this.shake(80, 0.005);
        this.floatText(tg.x, tg.y - 60, '+1', this.css(i), 64);
        if (!this.isCpu(i)) haptics.medium();
        b.s.destroy();
        tg.r = Math.max(55, tg.r - 6); tg.sx += 0.08; tg.sy += 0.07; tg.t += rnd(1, 4);
        this.tgS.setDisplaySize(tg.r * 2, tg.r * 2);
        this.tweens.add({ targets: this.tgS, angle: 360, duration: 300 });
        if (this.score[i] >= this.goal) this.endRound(i);
        return false;
      }
      if (b.x < -50 || b.x > this.W + 50 || b.y < -50 || b.y > this.H + 50) { b.s.destroy(); return false; }
      return true;
    });
  }
}

// ---------------------------------------------------------------- Hot potato bomb
export class Bomb extends BaseGame {
  constructor() { super('bomb'); }
  setup() {
    this.bg(0x8a2a2a, 0x2a0a14);
    const R = this.R = Math.min(this.W * 0.38, (this.bottom - this.top) / 2 - 60);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3).fillCircle(this.cx, this.cy + 20, R + 120);
    g.fillStyle(0x5a1a24, 1).fillCircle(this.cx, this.cy, R + 120);
    g.lineStyle(8, 0xff6b35, 0.4).strokeCircle(this.cx, this.cy, R + 120);
    this.vignette();
    this.ps = this.slots.map((s, i) => {
      const a = this.seatAngle(i);
      const x = this.cx + Math.cos(a) * R, y = this.cy + Math.sin(a) * R;
      const spr = this.add.image(x, y, 'char_' + s.p).setDisplaySize(150, 150).setDepth(5);
      return { x, y, spr };
    });
    this.holder = irnd(0, this.n - 1);
    this.fuse = rnd(7, 13);
    this.hold = 0;
    this.flying = false;
    this.bomb = this.add.image(this.ps[this.holder].x, this.ps[this.holder].y - 90, 'bomb').setDisplaySize(110, 126).setDepth(8);
    this.tickT = 0;
    this.fuseTxt = body(this, this.cx, this.cy, 'Lempar bomnya!', 40, '#ffd9c2').setAlpha(0.8);
  }
  onDown(i) {
    if (i !== this.holder || this.flying || this.hold < 0.45) return;
    const others = this.aliveList().filter(k => k !== i);
    if (!others.length) return;
    const to = others[irnd(0, others.length - 1)];
    this.flying = true;
    audio.play('whoosh');
    const p = this.ps[to];
    this.tweens.add({ targets: this.bomb, x: p.x, duration: 330, ease: 'Linear' });
    this.tweens.add({ targets: this.bomb, y: { from: this.bomb.y, to: p.y - 90 }, duration: 330, ease: 'Sine.easeOut', onComplete: () => { this.flying = false; this.holder = to; this.hold = 0; audio.play('pop'); this.tweens.add({ targets: p.spr, scaleY: p.spr.scaleY * 0.85, duration: 100, yoyo: true }); } });
    this.tweens.add({ targets: this.bomb, angle: '+=360', duration: 330 });
  }
  cpu(i, dt) {
    if (i !== this.holder || this.flying) return;
    this.ps[i].wait ??= rnd(0.55, 1.3);
    if (this.hold > this.ps[i].wait) { this.ps[i].wait = undefined; this.cpuTap(i); }
  }
  tick(dt) {
    if (!this.flying) this.hold += dt;
    this.fuse -= dt;
    const urgency = clamp(1 - this.fuse / 8, 0, 1);
    this.tickT -= dt;
    if (this.tickT <= 0) { this.tickT = 0.5 - urgency * 0.38; audio.play('tick', { rate: 1 + urgency * 0.6 }); this.bomb.setTint(urgency > 0.6 ? 0xff8080 : 0xffffff); this.time.delayedCall(70, () => this.bomb.clearTint()); }
    if (!this.flying) {
      const p = this.ps[this.holder];
      this.bomb.x = p.x + Math.sin(this.t * 40) * urgency * 8;
      this.bomb.y = p.y - 90;
    }
    if (this.lastHolder !== this.holder) { if (this.lastHolder !== undefined) this.highlight(this.lastHolder, false); this.highlight(this.holder, true); this.lastHolder = this.holder; }
    if (this.fuse <= 0 && !this.flying) {
      const i = this.holder;
      const p = this.ps[i];
      audio.play('boom'); this.shake(400, 0.02);
      this.burst(p.x, p.y, 0xff8a3c, 60); this.burst(p.x, p.y, 0xffd23f, 30);
      const fl = this.add.rectangle(this.cx, this.cy, this.W, this.H, 0xffffff, 0.6).setDepth(90);
      this.tweens.add({ targets: fl, alpha: 0, duration: 300, onComplete: () => fl.destroy() });
      p.spr.setTexture('charO_' + this.slots[i].p).setTint(0x555555);
      this.highlight(i, false);
      this.eliminate(i, { sound: 'boom', silentCheck: true });
      const al = this.aliveList();
      if (al.length <= 1) { this.bomb.setVisible(false); this.time.delayedCall(500, () => this.endRound(al.length ? al[0] : -1)); return; }
      this.holder = al[irnd(0, al.length - 1)];
      this.fuse = rnd(6, 11); this.hold = -0.6;
      this.bomb.setDisplaySize(110, 126).setAngle(0);
      this.floatText(this.cx, this.cy, 'BOM BARU!', '#ffd23f', 60);
    }
  }
}
