import Phaser from 'phaser';
import BaseGame, { TAU, rnd, irnd, clamp, angDiff } from './BaseGame.js';
import { C, PCOL, txt, body } from '../theme.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';

// ---------------------------------------------------------------- Air hockey (2P)
export class Hockey extends BaseGame {
  constructor() { super('hockey'); }
  setup() {
    const { W, H, cx, cy } = this;
    this.bg(0x0d3b66, 0x061a33);
    const l = this.l = 50, r = this.r = W - 50, t = this.tp = 70, b = this.bt = H - 70;
    this.gw = 360;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35).fillRoundedRect(l - 20, t - 6, r - l + 40, b - t + 40, 70);
    g.fillStyle(C.outline, 1).fillRoundedRect(l - 26, t - 26, r - l + 52, b - t + 52, 74);
    g.fillStyle(0x3d8bff, 1).fillRoundedRect(l - 18, t - 18, r - l + 36, b - t + 36, 68);
    g.fillStyle(0xeaf6ff, 1).fillRoundedRect(l, t, r - l, b - t, 56);
    for (let k = 0; k < 40; k++) g.fillStyle(0xc8e4ff, 0.6).fillCircle(rnd(l + 20, r - 20), rnd(t + 20, b - 20), 3);
    g.lineStyle(8, 0xff4d5e, 0.8).lineBetween(l, cy, r, cy);
    g.lineStyle(8, 0x3d8bff, 0.6).strokeCircle(cx, cy, 130);
    g.lineStyle(8, 0x3d8bff, 0.6).beginPath().arc(cx, t, 200, 0, Math.PI).strokePath();
    g.beginPath().arc(cx, b, 200, Math.PI, TAU).strokePath();
    g.fillStyle(C.outline, 1).fillRect(cx - this.gw / 2, t - 26, this.gw, 26).fillRect(cx - this.gw / 2, b, this.gw, 26);
    this.score = [0, 0]; this.goal = 7;
    this.scT = [txt(this, W - 110, cy + 110, '0', 110, '#ff4d5e').setAlpha(0.8), txt(this, 110, cy - 110, '0', 110, '#3d8bff').setAlpha(0.8).setRotation(Math.PI)];
    this.ms = [0, 1].map(i => {
      const y = i === 0 ? b - 220 : t + 220;
      return { i, x: cx, y, tx: cx, ty: y, vx: 0, vy: 0, r: 72, s: this.add.image(cx, y, 'mallet_' + this.slots[i].p).setDisplaySize(150, 150).setDepth(6), pid: null };
    });
    this.puck = { x: cx, y: cy, vx: 0, vy: 0, r: 40 };
    this.pS = this.add.image(cx, cy, 'puck').setDisplaySize(84, 84).setDepth(5);
    this.trail = this.add.particles(0, 0, 'dot', { follow: this.pS, scale: { start: 0.9, end: 0 }, alpha: { start: 0.25, end: 0 }, lifespan: 220, frequency: 20, tint: 0x5d567a }).setDepth(4);
    this.input.on('pointerdown', p => this.grab(p));
    this.input.on('pointermove', p => this.ms.forEach(m => { if (m.pid === p.id) { m.tx = p.x; m.ty = p.y - (m.i === 0 ? 40 : -40); } }));
    this.input.on('pointerup', p => this.ms.forEach(m => { if (m.pid === p.id) m.pid = null; }));
  }
  grab(p) {
    const i = p.y > this.cy ? 0 : 1;
    if (this.isCpu(i)) return;
    this.ms[i].pid = p.id; this.ms[i].tx = p.x; this.ms[i].ty = p.y - (i === 0 ? 40 : -40);
  }
  cpu(i, dt) {
    const m = this.ms[i], p = this.puck;
    const lvl = 1;
    if (p.y < this.cy + 40 && p.y > this.tp) {
      if (p.y < m.y + 10) { m.tx = p.x + (p.x > this.cx ? 60 : -60); m.ty = this.tp + 90; }
      else { m.tx = p.x + (this.cx - p.x) * 0.15; m.ty = p.y - 30; }
    } else { m.tx = this.cx + (p.x - this.cx) * 0.4; m.ty = this.tp + 170; }
  }
  tick(dt) {
    const { l, r, tp, bt, cx, cy } = this;
    this.ms.forEach(m => {
      const minY = m.i === 0 ? cy + m.r : tp + m.r, maxY = m.i === 0 ? bt - m.r : cy - m.r;
      const tx = clamp(m.tx, l + m.r, r - m.r), ty = clamp(m.ty, minY, maxY);
      const maxSp = this.isCpu(m.i) ? 1000 : 4200;
      let dx = tx - m.x, dy = ty - m.y; const d = Math.hypot(dx, dy), step = maxSp * dt;
      if (d > step) { dx *= step / d; dy *= step / d; }
      m.vx = dx / dt; m.vy = dy / dt;
      m.x += dx; m.y += dy;
      m.s.setPosition(m.x, m.y);
    });
    const p = this.puck;
    const steps = 3;
    for (let k = 0; k < steps; k++) {
      const h = dt / steps;
      p.x += p.vx * h; p.y += p.vy * h;
      if (p.x < l + p.r) { p.x = l + p.r; p.vx = Math.abs(p.vx) * 0.92; this.bonk(); }
      if (p.x > r - p.r) { p.x = r - p.r; p.vx = -Math.abs(p.vx) * 0.92; this.bonk(); }
      const mouth = Math.abs(p.x - cx) < this.gw / 2 - 6;
      if (!mouth) {
        if (p.y < tp + p.r) { p.y = tp + p.r; p.vy = Math.abs(p.vy) * 0.92; this.bonk(); }
        if (p.y > bt - p.r) { p.y = bt - p.r; p.vy = -Math.abs(p.vy) * 0.92; this.bonk(); }
      }
      this.ms.forEach(m => {
        const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy), min = p.r + m.r;
        if (d < min && d > 0) {
          const nx = dx / d, ny = dy / d;
          p.x = m.x + nx * min; p.y = m.y + ny * min;
          const rvx = p.vx - m.vx, rvy = p.vy - m.vy, vn = rvx * nx + rvy * ny;
          if (vn < 0) { p.vx -= 1.9 * vn * nx; p.vy -= 1.9 * vn * ny; audio.play('punch', { volume: clamp(-vn / 2000, 0.3, 1) }); if (!this.isCpu(m.i)) haptics.light(); }
        }
      });
    }
    const f = Math.pow(0.7, dt); p.vx *= f; p.vy *= f;
    const sp = Math.hypot(p.vx, p.vy); if (sp > 2600) { p.vx *= 2600 / sp; p.vy *= 2600 / sp; }
    this.pS.setPosition(p.x, p.y);
    if (p.y < tp - 20 || p.y > bt + 20) this.goalScored(p.y < tp ? 0 : 1);
  }
  bonk() { audio.play('bounce', { volume: 0.4 }); }
  goalScored(by) {
    this.score[by]++;
    this.scT[by].setText(String(this.score[by]));
    this.tweens.add({ targets: this.scT[by], scale: { from: 1.8, to: 1 }, duration: 400, ease: 'Back.easeOut' });
    audio.play('win'); this.shake(260, 0.012); this.burst(this.puck.x, this.puck.y, this.col(by), 40);
    this.floatText(this.cx, this.cy + (by === 0 ? 200 : -200), 'GOL!', this.css(by), 110, by === 0 ? 0 : Math.PI);
    haptics.success();
    if (this.score[by] >= this.goal) { this.puck.vx = this.puck.vy = 0; this.finishPoints(this.score, { label: 'gol' }); return; }
    const p = this.puck; p.vx = p.vy = 0; p.x = this.cx; p.y = this.cy + (by === 0 ? -160 : 160);
    this.pS.setScale(0); this.tweens.add({ targets: this.pS, scale: 84 / 96, duration: 300, ease: 'Back.easeOut' });
  }
}

// ---------------------------------------------------------------- 4-sided pong
export class Pong extends BaseGame {
  constructor() { super('pong'); }
  setup() {
    const { W, cx, cy } = this;
    this.bg(0x1a1033, 0x0a0620);
    const S = this.S = W - 140;
    this.a = { l: cx - S / 2, r: cx + S / 2, t: cy - S / 2, b: cy + S / 2 };
    this.g = this.add.graphics().setDepth(2);
    // side: 0 bottom, 1 top, 2 left, 3 right
    this.lives = this.slots.map(() => 3);
    this.pads = this.slots.map((s, i) => ({ i, side: i, pos: 0, target: 0, len: 230, pid: null }));
    this.livesT = this.pads.map((p, i) => {
      const pos = [[cx, this.a.b + 120, 0], [cx, this.a.t - 120, Math.PI], [this.a.l + 80, cy, Math.PI / 2], [this.a.r - 80, cy, -Math.PI / 2]][i];
      return txt(this, pos[0], pos[1], '♥♥♥', 64, this.css(i)).setRotation(pos[2]).setDepth(5);
    });
    this.balls = [];
    this.input.on('pointerdown', p => this.grab(p));
    this.input.on('pointermove', p => this.pads.forEach(pd => { if (pd.pid === p.id) pd.target = this.axis(pd, p); }));
    this.input.on('pointerup', p => this.pads.forEach(pd => { if (pd.pid === p.id) pd.pid = null; }));
    this.draw();
    body(this, cx, cy, 'Geser jari di sisimu', 40, '#a99bd6').setAlpha(0.6).setDepth(1);
  }
  axis(pd, p) { return pd.side < 2 ? p.x - this.cx : p.y - this.cy; }
  grab(p) {
    const { a } = this;
    let side;
    if (p.y > a.b - 40) side = 0; else if (p.y < a.t + 40) side = 1; else side = p.x < this.cx ? 2 : 3;
    if (this.n === 2 && side >= 2) side = p.y > this.cy ? 0 : 1;
    const pd = this.pads[side];
    if (!pd || this.isCpu(side)) return;
    pd.pid = p.id; pd.target = this.axis(pd, p);
  }
  onStart() { this.spawnBall(); }
  spawnBall() {
    let a = rnd(0, TAU);
    while (Math.abs(Math.cos(a)) > 0.85 || Math.abs(Math.sin(a)) > 0.85) a = rnd(0, TAU);
    if (this.n === 2 && Math.abs(Math.sin(a)) < 0.5) a = (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2 + rnd(-0.6, 0.6);
    const s = this.add.circle(this.cx, this.cy, 22, 0xffffff).setStrokeStyle(6, C.outline).setDepth(6);
    const b = { x: this.cx, y: this.cy, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, s, wait: 0.6 };
    this.balls.push(b);
    s.setScale(0); this.tweens.add({ targets: s, scale: 1, duration: 400, ease: 'Back.easeOut' });
  }
  cpu(i, dt) {
    const pd = this.pads[i];
    let tgt = 0, best = 1e9;
    this.balls.forEach(b => {
      const toward = [b.vy > 0, b.vy < 0, b.vx < 0, b.vx > 0][pd.side];
      const dist = [this.a.b - b.y, b.y - this.a.t, b.x - this.a.l, this.a.r - b.x][pd.side];
      if (toward && dist < best) { best = dist; tgt = pd.side < 2 ? b.x - this.cx : b.y - this.cy; }
    });
    pd.err ??= rnd(-60, 60);
    if (Math.random() < dt) pd.err = rnd(-80, 80);
    pd.target = tgt + pd.err * 0.8;
  }
  wall(side) { return side >= this.n || this.lives[side] <= 0; }
  tick(dt) {
    const { a } = this;
    this.pads.forEach(pd => {
      const lim = this.S / 2 - pd.len / 2;
      const max = (this.isCpu(pd.i) ? 820 : 5000) * dt;
      pd.pos += clamp(clamp(pd.target, -lim, lim) - pd.pos, -max, max);
    });
    if (this.t > 18 && this.balls.length < 2) { this.spawnBall(); this.floatText(this.cx, this.cy, 'BOLA KEDUA!', '#ffd23f', 60); }
    this.balls.forEach(b => {
      if (b.wait > 0) { b.wait -= dt; return; }
      const sp = Math.hypot(b.vx, b.vy), ns = Math.min(1500, sp + dt * 18);
      b.vx *= ns / sp; b.vy *= ns / sp;
      b.x += b.vx * dt; b.y += b.vy * dt;
      const R = 22;
      const sides = [[b.y > a.b - R - 24, 0], [b.y < a.t + R + 24, 1], [b.x < a.l + R + 24, 2], [b.x > a.r - R - 24, 3]];
      for (const [hit, side] of sides) {
        if (!hit) continue;
        const moving = [b.vy > 0, b.vy < 0, b.vx < 0, b.vx > 0][side];
        if (!moving) continue;
        const along = side < 2 ? b.x - this.cx : b.y - this.cy;
        if (this.wall(side)) { this.reflect(b, side, 0); audio.play('bounce', { volume: 0.4 }); continue; }
        const pd = this.pads[side];
        if (Math.abs(along - pd.pos) < pd.len / 2 + R) {
          this.reflect(b, side, (along - pd.pos) / (pd.len / 2));
          audio.play('punch'); this.burst(b.x, b.y, this.col(side), 8);
          if (!this.isCpu(side)) haptics.light();
        } else if ([b.y > a.b + 30, b.y < a.t - 30, b.x < a.l - 30, b.x > a.r + 30][side]) {
          this.miss(side, b);
        }
      }
      b.s.setPosition(b.x, b.y);
    });
    this.balls = this.balls.filter(b => !b.dead);
    this.draw();
  }
  reflect(b, side, off) {
    const sp = Math.hypot(b.vx, b.vy);
    const n = [[0, -1], [0, 1], [1, 0], [-1, 0]][side];
    let ang = Math.atan2(n[1], n[0]) + clamp(off, -1, 1) * 0.9;
    if (side === 0 || side === 1) ang = Math.atan2(n[1], n[0]) + (side === 0 ? 1 : -1) * clamp(off, -1, 1) * 0.9;
    else ang = Math.atan2(n[1], n[0]) + (side === 2 ? 1 : -1) * clamp(off, -1, 1) * 0.9;
    if (off === 0) { if (side < 2) b.vy *= -1; else b.vx *= -1; }
    else { b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp; }
    const { a } = this, R = 22;
    if (side === 0) b.y = a.b - R - 25; if (side === 1) b.y = a.t + R + 25; if (side === 2) b.x = a.l + R + 25; if (side === 3) b.x = a.r - R - 25;
  }
  miss(side, b) {
    b.dead = true; b.s.destroy();
    this.lives[side]--;
    this.livesT[side].setText('♥'.repeat(Math.max(0, this.lives[side])) || 'X');
    audio.play('hit'); this.shake(180, 0.01);
    this.floatText(b.x, b.y, '-1', '#ff4d5e', 70);
    if (this.lives[side] <= 0) {
      this.alive[side] = false; audio.play('lose');
      if (!this.isCpu(side)) haptics.heavy();
      const al = this.aliveList();
      if (al.length <= 1) { this.balls.forEach(x => { x.dead = true; x.s.destroy(); }); this.time.delayedCall(400, () => this.endRound(al.length ? al[0] : -1)); return; }
    }
    this.time.delayedCall(500, () => { if (!this.ended && this.balls.length < 1 + (this.t > 18 ? 1 : 0)) this.spawnBall(); });
  }
  draw() {
    const g = this.g, { a } = this;
    g.clear();
    g.fillStyle(C.outline, 1).fillRoundedRect(a.l - 30, a.t - 30, this.S + 60, this.S + 60, 40);
    g.fillStyle(0x23184a, 1).fillRect(a.l, a.t, this.S, this.S);
    g.lineStyle(4, 0xffffff, 0.08).strokeCircle(this.cx, this.cy, 160);
    for (let s = 0; s < 4; s++) {
      const col = this.wall(s) ? 0x5d567a : PCOL[this.slots[s].p];
      g.fillStyle(col, this.wall(s) ? 1 : 0.18);
      if (s === 0) g.fillRect(a.l, a.b - 10, this.S, 10); if (s === 1) g.fillRect(a.l, a.t, this.S, 10);
      if (s === 2) g.fillRect(a.l, a.t, 10, this.S); if (s === 3) g.fillRect(a.r - 10, a.t, 10, this.S);
      if (this.wall(s)) {
        g.fillStyle(0x7a6f99, 1);
        if (s === 0) g.fillRect(a.l, a.b - 22, this.S, 22); if (s === 1) g.fillRect(a.l, a.t, this.S, 22);
        if (s === 2) g.fillRect(a.l, a.t, 22, this.S); if (s === 3) g.fillRect(a.r - 22, a.t, 22, this.S);
        continue;
      }
      const pd = this.pads[s], L = pd.len, T = 30;
      let x, y, w, h;
      if (s === 0) { x = this.cx + pd.pos - L / 2; y = a.b - 24 - T / 2; w = L; h = T; }
      if (s === 1) { x = this.cx + pd.pos - L / 2; y = a.t + 24 - T / 2; w = L; h = T; }
      if (s === 2) { x = a.l + 24 - T / 2; y = this.cy + pd.pos - L / 2; w = T; h = L; }
      if (s === 3) { x = a.r - 24 - T / 2; y = this.cy + pd.pos - L / 2; w = T; h = L; }
      g.fillStyle(C.outline, 1).fillRoundedRect(x - 6, y - 6, w + 12, h + 12, 18);
      g.fillStyle(col, 1).fillRoundedRect(x, y, w, h, 14);
      g.fillStyle(0xffffff, 0.35).fillRoundedRect(x + 4, y + 4, w - 8, Math.min(h, w) * 0.35, 8);
    }
  }
}

// ---------------------------------------------------------------- Lane race (hold = gas)
export class Race extends BaseGame {
  constructor() { super('race'); }
  setup() {
    const { W, cx, cy } = this;
    this.bg(0x3f7d3a, 0x1f4a1f);
    const n = this.n;
    this.laneW = 78;
    this.Rm = W * 0.3;
    this.L = (this.bottom - this.top) - 2 * (this.Rm + this.laneW * 2.3) - 40;
    const g = this.add.graphics();
    const outer = this.Rm + this.laneW * 2.3, inner = this.Rm - this.laneW * 2.3;
    const stadium = (r, col, a = 1) => {
      g.fillStyle(col, a);
      g.fillCircle(cx, cy - this.L / 2, r).fillCircle(cx, cy + this.L / 2, r).fillRect(cx - r, cy - this.L / 2, r * 2, this.L);
    };
    stadium(outer + 30, C.outline); stadium(outer + 20, 0xff4d5e); stadium(outer, 0x4a4560);
    for (let k = 1; k < 4; k++) {
      const rr = inner + (outer - inner) * k / 4;
      g.lineStyle(4, 0xffffff, 0.25);
      g.beginPath().arc(cx, cy - this.L / 2, rr, Math.PI, TAU).strokePath();
      g.beginPath().arc(cx, cy + this.L / 2, rr, 0, Math.PI).strokePath();
      g.lineBetween(cx - rr, cy - this.L / 2, cx - rr, cy + this.L / 2); g.lineBetween(cx + rr, cy - this.L / 2, cx + rr, cy + this.L / 2);
    }
    stadium(inner, 0xffffff); stadium(inner - 12, 0x4f9a3f);
    for (let k = 0; k < 14; k++) g.fillStyle(0x3f7d3a, 1).fillCircle(cx + rnd(-inner * 0.6, inner * 0.6), cy + rnd(-this.L / 2, this.L / 2), rnd(10, 30));
    // finish line on the right straight middle
    for (let k = 0; k < 10; k++) for (let j = 0; j < 2; j++) g.fillStyle((k + j) % 2 ? 0xffffff : 0x140b2b, 1).fillRect(cx + inner + (outer - inner) * k / 10, cy - 12 + j * 12, (outer - inner) / 10 + 1, 12);
    // curve warning markers
    g.fillStyle(0xffd23f, 1);
    this.vignette();
    this.laps = 3;
    this.cars = this.slots.map((s, i) => {
      const off = (i - (n - 1) / 2) * this.laneW;
      const r = this.Rm + off;
      const P = 2 * this.L + TAU * r;
      const spr = this.add.image(0, 0, 'car_' + s.p).setDisplaySize(120, 75).setDepth(6);
      const smoke = this.add.particles(0, 0, 'dot', { follow: spr, scale: { start: 0.8, end: 2 }, alpha: { start: 0.5, end: 0 }, lifespan: 500, frequency: 40, tint: 0xdddddd, emitting: false }).setDepth(5);
      const lap = txt(this, 0, 0, '', 28, this.css(i)).setDepth(7);
      return { i, r, P, s: this.L / 2 + 0.001, v: 0, lap: 0, spin: 0, over: 0, spr, smoke, lapT: lap, limit: 470 * Math.sqrt(r / this.Rm) };
    });
    this.place();
  }
  pos(c, s) {
    const { cx, cy, L } = this; const r = c.r;
    s = ((s % c.P) + c.P) % c.P;
    if (s < L) return { x: cx + r, y: cy + L / 2 - s, a: -Math.PI / 2, curve: false };
    s -= L;
    if (s < Math.PI * r) { const t = s / r; return { x: cx + Math.cos(-t) * r, y: cy - L / 2 + Math.sin(-t) * r, a: -t - Math.PI / 2, curve: true }; }
    s -= Math.PI * r;
    if (s < L) return { x: cx - r, y: cy - L / 2 + s, a: Math.PI / 2, curve: false };
    s -= L;
    const t = s / r; return { x: cx + Math.cos(Math.PI - t) * r, y: cy + L / 2 + Math.sin(Math.PI - t) * r, a: Math.PI / 2 - t, curve: true };
  }
  place() {
    this.cars.forEach(c => {
      const p = this.pos(c, c.s);
      c.spr.setPosition(p.x, p.y);
      if (c.spin <= 0) c.spr.setRotation(p.a);
      c.lapT.setPosition(p.x, p.y - 60).setText(c.lap < this.laps ? `${c.lap + 1}/${this.laps}` : '');
      c.curve = p.curve;
    });
  }
  distToCurve(c) {
    const s = ((c.s % c.P) + c.P) % c.P, L = this.L, r = c.r;
    const starts = [L, L + Math.PI * r + L];
    let best = 1e9;
    for (const st of starts) { let d = st - s; if (d < 0) d += c.P; best = Math.min(best, d); }
    return best;
  }
  cpu(i, dt) {
    const c = this.cars[i];
    const lim = c.limit * (c.skill ??= rnd(0.86, 0.97));
    if (c.curve) this.setDown(i, c.v < lim * 0.97);
    else {
      const d = this.distToCurve(c);
      const brake = (c.v * c.v - lim * lim) / (2 * 650);
      this.setDown(i, d > brake + 30);
    }
  }
  tick(dt) {
    this.cars.forEach((c, i) => {
      if (c.done) return;
      if (c.spin > 0) {
        c.spin -= dt; c.spr.rotation += 14 * dt; c.v = Math.max(0, c.v - 900 * dt);
      } else if (this.down[i]) c.v = Math.min(980, c.v + 420 * dt);
      else c.v = Math.max(0, c.v - 650 * dt);
      if (c.curve && c.v > c.limit && c.spin <= 0) {
        c.over += dt; c.smoke.emitting = true;
        if (c.over > 0.25) { c.spin = 1; c.over = 0; c.v *= 0.3; audio.play('slide'); this.shake(120, 0.006); this.floatText(c.spr.x, c.spr.y - 50, 'SELIP!', '#ffd23f', 44); if (!this.isCpu(i)) haptics.heavy(); }
      } else { c.over = 0; c.smoke.emitting = c.spin > 0; }
      const before = Math.floor((c.s - this.L / 2) / c.P);
      c.s += c.v * dt;
      const after = Math.floor((c.s - this.L / 2) / c.P);
      if (after > before) {
        c.lap++;
        if (c.lap >= this.laps) {
          c.done = true;
          audio.play('levelup');
          if (!this.ended) { this.burst(c.spr.x, c.spr.y, this.col(i), 50); this.endRound(i); }
        } else { audio.play('point'); this.floatText(c.spr.x, c.spr.y - 70, `PUTARAN ${c.lap + 1}`, this.css(i), 40); }
      }
    });
    this.place();
  }
}

// ---------------------------------------------------------------- Sprint (tap mash)
export class Run extends BaseGame {
  constructor() { super('run'); }
  setup() {
    const { W, cx, cy } = this;
    this.bg(0x6dd5fa, 0x2980b9);
    const n = this.n, lh = 170;
    const h = n * lh;
    this.y0 = cy - h / 2;
    const g = this.add.graphics();
    g.fillStyle(0x5cb83d, 1).fillRect(0, this.y0 - 120, W, h + 240);
    g.fillStyle(C.outline, 1).fillRect(0, this.y0 - 14, W, h + 28);
    g.fillStyle(0xc0643a, 1).fillRect(0, this.y0, W, h);
    for (let k = 1; k < n; k++) g.fillStyle(0xffffff, 0.8).fillRect(0, this.y0 + k * lh - 3, W, 6);
    this.x0 = 170; this.x1 = W - 120;
    g.fillStyle(0xffffff, 1).fillRect(this.x0 - 4, this.y0, 8, h);
    for (let k = 0; k < Math.ceil(h / 24); k++) for (let j = 0; j < 2; j++) g.fillStyle((k + j) % 2 ? 0xffffff : 0x140b2b, 1).fillRect(this.x1 + j * 20, this.y0 + k * 24, 20, 24);
    // crowd
    for (let k = 0; k < 26; k++) { const x = k * 44 + 20; g.fillStyle(PCOL[k % 4], 0.85).fillCircle(x, this.y0 - 70 + (k % 2) * 16, 20); g.fillStyle(PCOL[(k + 2) % 4], 0.85).fillCircle(x, this.y0 + h + 70 - (k % 2) * 16, 20); }
    this.rs = this.slots.map((s, i) => {
      const y = this.y0 + i * lh + lh / 2;
      const spr = this.add.image(this.x0, y, 'char_' + s.p).setDisplaySize(120, 120).setDepth(5);
      const lbl = txt(this, 56, y, s.cpu ? 'CPU' : 'P' + (s.p + 1), 36, this.css(i)).setDepth(5);
      return { x: this.x0, v: 0, y, spr, bob: 0 };
    });
    this.dust = this.add.particles(0, 0, 'dot', { speedX: { min: -260, max: -80 }, speedY: { min: -60, max: 0 }, scale: { start: 0.9, end: 0 }, alpha: { start: 0.6, end: 0 }, lifespan: 400, tint: 0xe0b080, emitting: false }).setDepth(4);
  }
  onDown(i) {
    const r = this.rs[i];
    r.v = Math.min(r.v + 62, 900);
    audio.play('tap', { volume: 0.4, rate: 0.8 + r.v / 1200 });
    this.dust.explode(2, r.x - 40, r.y + 50);
  }
  cpu(i, dt) {
    const r = this.rs[i];
    r.rate ??= rnd(6.2, 8.4);
    r.acc = (r.acc || 0) + dt * r.rate * rnd(0.7, 1.3);
    if (r.acc >= 1) { r.acc = 0; this.cpuTap(i, 40); }
  }
  tick(dt) {
    this.rs.forEach((r, i) => {
      r.v *= Math.pow(0.35, dt);
      r.x += r.v * dt;
      r.bob += r.v * dt * 0.05;
      r.spr.setPosition(r.x, r.y - Math.abs(Math.sin(r.bob)) * 24).setRotation(Math.sin(r.bob) * 0.15);
      if (r.x >= this.x1 && !this.ended) { this.burst(r.x, r.y, this.col(i), 40); this.endRound(i); }
    });
  }
}

// ---------------------------------------------------------------- Tug of war
export class Tug extends BaseGame {
  constructor() { super('tug'); }
  setup() {
    const { W, cx, cy } = this;
    this.bg(0x7ec0ee, 0x3a6ab0);
    const g = this.add.graphics();
    g.fillStyle(0x5cb83d, 1).fillRect(0, this.top, W, this.bottom - this.top);
    g.fillStyle(0x4aa232, 1);
    for (let k = 0; k < 30; k++) g.fillCircle(rnd(0, W), rnd(this.top, this.bottom), rnd(10, 40));
    this.mud = this.add.ellipse(cx, cy, 420, 200, 0x7a4b2a).setStrokeStyle(8, 0x5a3418);
    g.fillStyle(0xffffff, 1).fillRect(cx - 220, cy - 360, 440, 10).fillRect(cx - 220, cy + 350, 440, 10);
    this.vignette();
    this.m = 0; // -1 = top team wins, +1 = bottom team wins
    this.rope = this.add.graphics().setDepth(5);
    this.flag = this.add.image(cx, cy, 'star').setDisplaySize(70, 70).setDepth(7);
    this.team = [[], []];
    this.slots.forEach((s, i) => this.team[this.teamOf(i)].push(i));
    this.guys = this.slots.map((s, i) => {
      const t = this.teamOf(i), k = this.team[t].indexOf(i);
      const spr = this.add.image(cx, 0, 'char_' + s.p).setDisplaySize(130, 130).setDepth(6);
      return { t, k, spr };
    });
    this.draw();
  }
  onDown(i) {
    const t = this.teamOf(i);
    const pull = 0.03 / this.team[t].length;
    this.m += t === 0 ? pull : -pull;
    const gu = this.guys[i];
    this.tweens.add({ targets: gu.spr, scaleY: { from: gu.spr.scaleY * 0.85, to: gu.spr.scaleY }, duration: 120 });
    audio.play('tap', { volume: 0.5, rate: t ? 1.2 : 0.9 });
  }
  cpu(i, dt) {
    const g = this.guys[i];
    g.rate ??= rnd(6, 8.2);
    g.acc = (g.acc || 0) + dt * g.rate * rnd(0.6, 1.4);
    if (g.acc >= 1) { g.acc = 0; this.cpuTap(i, 40); }
  }
  draw() {
    const { cx, cy } = this;
    const off = this.m * 340;
    const y1 = cy - 520 + off, y2 = cy + 520 + off;
    const g = this.rope; g.clear();
    g.lineStyle(30, C.outline, 1).lineBetween(cx, y1, cx, y2);
    g.lineStyle(20, 0xd9a35b, 1).lineBetween(cx, y1, cx, y2);
    for (let y = y1; y < y2; y += 26) g.lineStyle(4, 0xa8783b, 1).lineBetween(cx - 10, y, cx + 10, y + 12);
    g.fillStyle(0xff4d5e, 1).fillRect(cx - 50, cy + off - 8, 100, 16);
    this.flag.setPosition(cx, cy + off);
    this.guys.forEach(gu => {
      const base = gu.t === 0 ? y2 - 60 - gu.k * 150 : y1 + 60 + gu.k * 150;
      gu.spr.setPosition(cx + (gu.k % 2 ? 70 : -70), base).setRotation(gu.t === 0 ? -0.2 + Math.sin(this.t * 20) * 0.03 : Math.PI + 0.2);
    });
  }
  tick(dt) {
    this.m *= Math.pow(0.9, dt);
    this.draw();
    if (Math.abs(this.m) >= 1) {
      const t = this.m > 0 ? 0 : 1;
      audio.play('splash'); this.shake(300, 0.012);
      this.endRound(this.team[t]);
    }
  }
}

// ---------------------------------------------------------------- Mini golf (turn based)
const HOLES = [
  { tee: [0.5, 0.86], hole: [0.5, 0.14], walls: [[0.2, 0.48, 0.6, 0.05]] },
  { tee: [0.2, 0.86], hole: [0.8, 0.14], walls: [[0, 0.62, 0.62, 0.05], [0.38, 0.36, 0.62, 0.05]] },
  { tee: [0.5, 0.88], hole: [0.5, 0.5], walls: [[0.25, 0.3, 0.5, 0.04], [0.25, 0.66, 0.5, 0.04], [0.25, 0.3, 0.05, 0.25], [0.7, 0.45, 0.05, 0.25]] }
];
export class Golf extends BaseGame {
  constructor() { super('golf'); }
  setup() {
    const { W, H } = this;
    this.bg(0x3a8a3a, 0x1a4a1a);
    this.f = { x: 60, y: 200, w: W - 120, h: H - 400 };
    this.g = this.add.graphics();
    this.aimG = this.add.graphics().setDepth(8);
    this.strokes = this.slots.map(() => 0);
    this.holeIdx = 0;
    this.balls = this.slots.map((s, i) => ({ i, x: 0, y: 0, vx: 0, vy: 0, in: false, sh: 0, s: this.add.circle(0, 0, 20, PCOL[s.p]).setStrokeStyle(6, C.outline).setDepth(6) }));
    this.info = txt(this, this.cx, 110, '', 52, '#ffffff').setDepth(9);
    this.info2 = txt(this, this.cx, H - 110, '', 52, '#ffffff').setDepth(9).setRotation(Math.PI);
    this.sumT = body(this, this.cx, H - 50, '', 30, '#e8ffe0').setDepth(9);
    this.loadHole();
    this.input.on('pointerdown', p => { if (this.canAim()) this.aim = { x0: p.x, y0: p.y, x: p.x, y: p.y }; });
    this.input.on('pointermove', p => { if (this.aim) { this.aim.x = p.x; this.aim.y = p.y; } });
    this.input.on('pointerup', p => { if (this.aim) { const a = this.aim; this.aim = null; this.shoot(a.x0 - a.x, a.y0 - a.y); } });
  }
  canAim() { return this.running && !this.ended && !this.moving && !this.isCpu(this.cur); }
  loadHole() {
    const h = HOLES[this.holeIdx], f = this.f;
    const P = (a, b) => [f.x + a * f.w, f.y + b * f.h];
    this.hole = P(...h.hole);
    this.walls = h.walls.map(w => ({ x: f.x + w[0] * f.w, y: f.y + w[1] * f.h, w: w[2] * f.w, h: w[3] * f.h }));
    const [tx, ty] = P(...h.tee);
    this.balls.forEach((b, i) => { b.x = tx + (i - (this.n - 1) / 2) * 50; b.y = ty; b.vx = b.vy = 0; b.in = false; b.sh = 0; b.s.setVisible(true).setScale(1); });
    this.drawCourse();
    this.cur = this.holeIdx % this.n;
    this.moving = false;
    this.updateInfo();
  }
  drawCourse() {
    const g = this.g, f = this.f;
    g.clear();
    g.fillStyle(0x000000, 0.3).fillRoundedRect(f.x - 20, f.y - 10, f.w + 40, f.h + 40, 40);
    g.fillStyle(0x7a4b2a, 1).fillRoundedRect(f.x - 26, f.y - 26, f.w + 52, f.h + 52, 40);
    g.fillStyle(0x6fd04a, 1).fillRoundedRect(f.x, f.y, f.w, f.h, 26);
    for (let k = 0; k < 12; k++) g.fillStyle(0x62c040, 1).fillRect(f.x, f.y + k * f.h / 12, f.w, f.h / 24);
    this.walls.forEach(w => {
      g.fillStyle(C.outline, 1).fillRoundedRect(w.x - 5, w.y - 5, w.w + 10, w.h + 10, 12);
      g.fillStyle(0xa0703a, 1).fillRoundedRect(w.x, w.y, w.w, w.h, 10);
      g.fillStyle(0xc89058, 1).fillRoundedRect(w.x + 4, w.y + 4, w.w - 8, w.h * 0.45, 6);
    });
    const [hx, hy] = this.hole;
    g.fillStyle(0x4fa83a, 1).fillCircle(hx, hy, 70);
    g.fillStyle(C.outline, 1).fillCircle(hx, hy, 30);
    g.fillStyle(0xffffff, 1).fillRect(hx - 3, hy - 150, 6, 150);
    g.fillStyle(0xff4d5e, 1).fillTriangle(hx + 3, hy - 150, hx + 70, hy - 125, hx + 3, hy - 100);
  }
  updateInfo() {
    const s = `LUBANG ${this.holeIdx + 1}/3 • GILIRAN ${this.pname(this.cur)}`;
    this.info.setText(s).setColor(this.css(this.cur)); this.info2.setText(s).setColor(this.css(this.cur));
    this.sumT.setText(this.slots.map((s, i) => `${this.pname(i)} ${this.strokes[i]}`).join('   '));
    this.balls.forEach((b, i) => { b.s.setStrokeStyle(i === this.cur ? 9 : 6, i === this.cur ? 0xffffff : C.outline); });
    const b = this.balls[this.cur];
    this.tweens.add({ targets: b.s, scale: { from: 1.6, to: 1 }, duration: 400, ease: 'Back.easeOut' });
    if (this.isCpu(this.cur) && this.running) this.time.delayedCall(800, () => this.cpuShot());
  }
  onStart() { if (this.isCpu(this.cur)) this.time.delayedCall(600, () => this.cpuShot()); }
  shoot(dx, dy) {
    const len = Math.hypot(dx, dy);
    if (len < 20) return;
    const p = Math.min(len, 380) / 380;
    const b = this.balls[this.cur];
    b.vx = dx / len * p * 2000; b.vy = dy / len * p * 2000;
    this.strokes[this.cur]++; b.sh++;
    this.moving = true;
    audio.play('punch', { volume: 0.4 + p * 0.6 });
  }
  sim(b, vx, vy, steps = 200) {
    const o = { x: b.x, y: b.y, vx, vy, r: 20 };
    const [hx, hy] = this.hole;
    for (let k = 0; k < steps; k++) {
      if (this.stepBall(o, 1 / 60)) return 0;
      if (Math.hypot(o.vx, o.vy) < 15) break;
    }
    return Math.hypot(o.x - hx, o.y - hy);
  }
  stepBall(o, dt) {
    const f = this.f;
    o.x += o.vx * dt;
    if (o.x < f.x + 20 || o.x > f.x + f.w - 20 || this.walls.some(w => o.x > w.x - 20 && o.x < w.x + w.w + 20 && o.y > w.y - 20 && o.y < w.y + w.h + 20)) { o.x -= o.vx * dt; o.vx *= -0.8; o.bonk = true; }
    o.y += o.vy * dt;
    if (o.y < f.y + 20 || o.y > f.y + f.h - 20 || this.walls.some(w => o.x > w.x - 20 && o.x < w.x + w.w + 20 && o.y > w.y - 20 && o.y < w.y + w.h + 20)) { o.y -= o.vy * dt; o.vy *= -0.8; o.bonk = true; }
    const fr = Math.pow(0.42, dt); o.vx *= fr; o.vy *= fr;
    const [hx, hy] = this.hole, d = Math.hypot(o.x - hx, o.y - hy), sp = Math.hypot(o.vx, o.vy);
    if (d < 30 && sp < 900) return true;
    if (d < 70) { o.vx += (hx - o.x) * 2 * dt; o.vy += (hy - o.y) * 2 * dt; }
    return false;
  }
  cpuShot() {
    if (!this.running || this.ended || this.moving || !this.isCpu(this.cur)) return;
    const b = this.balls[this.cur];
    let best = null, bd = 1e9;
    const base = Math.atan2(this.hole[1] - b.y, this.hole[0] - b.x);
    for (let k = 0; k < 36; k++) {
      const a = k < 12 ? base + rnd(-0.3, 0.3) : rnd(0, TAU);
      const pw = rnd(0.25, 1) * 2000;
      const d = this.sim(b, Math.cos(a) * pw, Math.sin(a) * pw);
      if (d < bd) { bd = d; best = [a, pw]; }
    }
    const [a, pw] = best;
    const err = rnd(-0.05, 0.05);
    const L = pw / 2000 * 380;
    this.shoot(Math.cos(a + err) * L, Math.sin(a + err) * L);
  }
  tick(dt) {
    this.aimG.clear();
    if (this.aim) {
      const b = this.balls[this.cur];
      const dx = this.aim.x0 - this.aim.x, dy = this.aim.y0 - this.aim.y, L = Math.min(Math.hypot(dx, dy), 380);
      const a = Math.atan2(dy, dx);
      this.aimG.lineStyle(8, 0xffffff, 0.9);
      for (let k = 0; k < L / 30; k++) this.aimG.fillStyle(0xffffff, 1 - k / (L / 30)).fillCircle(b.x + Math.cos(a) * (30 + k * 30), b.y + Math.sin(a) * (30 + k * 30), 8);
      this.aimG.fillStyle(L > 300 ? 0xff4d5e : 0xffd23f, 1).fillRoundedRect(b.x - 60, b.y + 40, 120 * L / 380, 16, 8);
    }
    if (this.moving) {
      const b = this.balls[this.cur];
      for (let k = 0; k < 2; k++) {
        if (this.stepBall(b, dt / 2)) {
          b.in = true; b.vx = b.vy = 0; this.moving = false;
          b.x = this.hole[0]; b.y = this.hole[1];
          this.tweens.add({ targets: b.s, scale: 0, duration: 250 });
          audio.play('levelup'); this.burst(b.x, b.y, this.col(this.cur), 30);
          this.floatText(b.x, b.y - 80, b.sh === 1 ? 'HOLE IN ONE!' : 'MASUK!', '#ffd23f', 60);
          this.time.delayedCall(700, () => this.nextTurn());
          break;
        }
        if (b.bonk) { audio.play('bounce', { volume: 0.4 }); b.bonk = false; }
      }
      if (this.moving && Math.hypot(b.vx, b.vy) < 15) {
        this.moving = false; b.vx = b.vy = 0;
        if (b.sh >= 6) { b.in = true; this.strokes[b.i]++; b.s.setVisible(false); this.floatText(b.x, b.y, 'MAKS!', '#ff4d5e', 50); }
        this.time.delayedCall(350, () => this.nextTurn());
      }
    }
    this.balls.forEach(b => b.s.setPosition(b.x, b.y));
  }
  nextTurn() {
    if (this.ended) return;
    const left = this.balls.filter(b => !b.in);
    if (!left.length) {
      if (this.holeIdx < HOLES.length - 1) { this.holeIdx++; this.bigText('LUBANG ' + (this.holeIdx + 1), '#ffd23f', 110, 900); this.time.delayedCall(900, () => this.loadHole()); }
      else this.finishPoints(this.strokes, { lowerBetter: true, label: 'pukulan' });
      return;
    }
    let k = this.cur;
    do { k = (k + 1) % this.n; } while (this.balls[k].in);
    this.cur = k;
    this.updateInfo();
  }
}
