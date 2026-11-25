import Phaser from 'phaser';
import BaseGame, { TAU, rnd, irnd, clamp } from './BaseGame.js';
import { C, PCOL, PCSS, PNAME, txt, body } from '../theme.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';

// text shown twice: normal for the bottom side, rotated for the top side
function dualText(sc, s, size, color, gap = 150) {
  const a = txt(sc, sc.cx, sc.cy + (sc.n >= 2 ? gap : 0), s, size, color).setDepth(10);
  const b = sc.n >= 2 ? txt(sc, sc.cx, sc.cy - gap, s, size, color).setRotation(Math.PI).setDepth(10) : null;
  const o = {
    set(t, c) { a.setText(t); b?.setText(t); if (c) { a.setColor(c); b?.setColor(c); } return o; },
    pop() { [a, b].forEach(x => x && sc.tweens.add({ targets: x, scale: { from: 1.4, to: 1 }, duration: 260, ease: 'Back.easeOut' })); return o; },
    alpha(v) { a.setAlpha(v); b?.setAlpha(v); return o; },
    objs: [a, b].filter(Boolean)
  };
  return o;
}

// ---------------------------------------------------------------- Cowboy quick draw
export class Cowboy extends BaseGame {
  constructor() { super('cowboy'); }
  setup() {
    const { W, H, cx, cy } = this;
    this.bg(0xf6b26b, 0xb85a2a);
    const g = this.add.graphics();
    g.fillStyle(0xfff0c0, 0.6).fillCircle(cx, cy, 260);
    g.fillStyle(0xd08a4a, 1).fillRect(0, cy + 60, W, 30).fillRect(0, cy - 90, W, 30);
    for (let k = 0; k < 6; k++) { const x = rnd(60, W - 60), y = rnd(this.top, this.bottom); g.fillStyle(0x3f8a3a, 1).fillRoundedRect(x - 14, y - 60, 28, 90, 12); g.fillRoundedRect(x - 40, y - 30, 22, 40, 10); g.fillRoundedRect(x + 18, y - 40, 22, 40, 10); }
    this.vignette();
    this.ps = this.slots.map((s, i) => {
      const a = this.seatAngle(i), D = this.n <= 2 ? 520 : 580;
      const x = cx + Math.cos(a) * D, y = cy + Math.sin(a) * D;
      const spr = this.add.image(x, y, 'char_' + s.p).setDisplaySize(160, 160).setDepth(5);
      const hat = this.add.graphics({ x, y }).setDepth(6).setRotation(this.isTop(i) ? Math.PI : 0);
      hat.fillStyle(C.outline, 1).fillEllipse(0, -70, 200, 44); hat.fillStyle(0x7a3f1c, 1).fillEllipse(0, -72, 186, 34);
      hat.fillStyle(C.outline, 1).fillRoundedRect(-58, -140, 116, 78, 24); hat.fillStyle(0x9b5b34, 1).fillRoundedRect(-52, -134, 104, 70, 20);
      hat.fillStyle(PCOL[s.p], 1).fillRect(-52, -84, 104, 14);
      return { x, y, spr, hat };
    });
    this.msg = dualText(this, 'SIAP...', 110, '#ffffff');
    this.state = 'wait';
    this.fireAt = rnd(1.8, 4.6);
    this.fakeAt = Math.random() < 0.45 ? rnd(0.8, this.fireAt - 0.5) : 99;
  }
  onDown(i) {
    if (this.state === 'wait') {
      audio.play('wrong');
      this.floatText(this.ps[i].x, this.ps[i].y - 120, 'TERLALU CEPAT!', '#ff4d5e', 44, this.isTop(i) ? Math.PI : 0);
      this.ps[i].spr.setTexture('charO_' + this.slots[i].p).setAlpha(0.5);
      this.eliminate(i, { sound: 'wrong' });
    } else if (this.state === 'fire') {
      this.state = 'done';
      const p = this.ps[i];
      const ms = Math.round((this.t - this.fireAt) * 1000);
      audio.play('shoot'); this.shake(200, 0.012);
      this.floatText(p.x, p.y - 140, ms + ' ms', '#ffffff', 50, this.isTop(i) ? Math.PI : 0);
      this.ps.forEach((o, k) => { if (k !== i && this.alive[k]) { o.spr.setTexture('charO_' + this.slots[k].p); this.tweens.add({ targets: [o.spr, o.hat], angle: 90, alpha: 0.4, duration: 400 }); } });
      this.endRound(i);
    }
  }
  cpu(i, dt) {
    const p = this.ps[i];
    if (this.state === 'wait') { if (Math.random() < dt * 0.02) this.cpuTap(i); return; }
    if (this.state === 'fire') { p.react ??= rnd(0.24, 0.5); if (this.t - this.fireAt > p.react) this.cpuTap(i); }
  }
  tick(dt) {
    if (this.state === 'wait' && this.t > this.fakeAt) { this.fakeAt = 99; this.msg.set(Phaser.Utils.Array.GetRandom(['DOK!', 'DUH!', 'DAR?']), '#ffd23f').pop(); audio.play('thud'); this.time.delayedCall(500, () => { if (this.state === 'wait') this.msg.set('SIAP...', '#ffffff'); }); }
    if (this.state === 'wait' && this.t >= this.fireAt) {
      this.state = 'fire';
      this.msg.set('DOR!', '#ff2e3e').pop();
      audio.play('go'); haptics.medium();
      const fl = this.add.rectangle(this.cx, this.cy, this.W, this.H, 0xffffff, 0.5).setDepth(9);
      this.tweens.add({ targets: fl, alpha: 0, duration: 250, onComplete: () => fl.destroy() });
    }
  }
}

// ---------------------------------------------------------------- Judge games: tap only when it's TRUE
class Judge extends BaseGame {
  setup() {
    this.bgSetup();
    this.goal = 5;
    this.score = this.slots.map(() => 0);
    this.slots.forEach((s, i) => this.tag(i, '0/' + this.goal));
    this.card = this.add.graphics().setDepth(8);
    this.msg = dualText(this, '', 100, '#ffffff', 140);
    this.cardT = 0; this.cur = null; this.locked = [];
    this.timerG = this.add.graphics().setDepth(9);
    this.drawCard(0xffffff);
  }
  drawCard(col) {
    const g = this.card; g.clear();
    const w = 900, h = this.n >= 2 ? 520 : 300;
    g.fillStyle(0x000000, 0.3).fillRoundedRect(this.cx - w / 2, this.cy - h / 2 + 16, w, h, 50);
    g.fillStyle(C.outline, 1).fillRoundedRect(this.cx - w / 2 - 8, this.cy - h / 2 - 8, w + 16, h + 16, 56);
    g.fillStyle(col, 1).fillRoundedRect(this.cx - w / 2, this.cy - h / 2, w, h, 50);
    if (this.n >= 2) g.fillStyle(0x000000, 0.06).fillRect(this.cx - w / 2 + 30, this.cy - 3, w - 60, 6);
  }
  onStart() { this.next(); }
  next() {
    this.cur = this.gen();
    this.cur.resolved = false;
    this.locked = this.slots.map(() => false);
    this.cardT = this.cur.time ?? 1.5;
    this.cardMax = this.cardT;
    this.msg.set(this.cur.text, this.cur.color || '#1a1033').pop();
    this.drawCard(0xffffff);
    audio.play('flip');
    this.cpuPlan = this.slots.map((s, i) => this.isCpu(i) ? (this.cur.truth ? (Math.random() < 0.88 ? rnd(0.38, 0.85) : 99) : (Math.random() < 0.05 ? rnd(0.3, 1) : 99)) : 99);
  }
  onDown(i) {
    if (!this.cur || this.cur.resolved || this.locked[i]) return;
    if (this.cur.truth) {
      this.cur.resolved = true;
      this.score[i]++;
      audio.play('correct'); this.burst(this.cx, this.cy, this.col(i), 30);
      this.drawCard(this.col(i));
      this.msg.set(this.pname(i) + ' +1', '#ffffff');
      if (!this.isCpu(i)) haptics.success();
      this.tag(i, this.score[i] + '/' + this.goal);
      if (this.score[i] >= this.goal) { this.time.delayedCall(500, () => this.endRound(i)); return; }
      this.cardT = 0.8;
    } else {
      this.locked[i] = true;
      this.score[i] = Math.max(0, this.score[i] - 1);
      this.tag(i, this.score[i] + '/' + this.goal);
      audio.play('wrong'); this.shake(150, 0.008);
      if (!this.isCpu(i)) haptics.error();
      const s = this.seat(i);
      this.floatText(s.x, s.y + (this.isTop(i) ? 200 : -200), 'SALAH! -1', '#ff4d5e', 50, this.isTop(i) ? Math.PI : 0);
    }
  }
  cpu(i, dt) { if (this.cur && !this.cur.resolved && this.cardMax - this.cardT > this.cpuPlan[i]) { this.cpuPlan[i] = 99; this.cpuTap(i); } }
  tick(dt) {
    if (!this.cur) return;
    this.cardT -= dt;
    const g = this.timerG; g.clear();
    if (!this.cur.resolved) { g.fillStyle(C.outline, 0.4).fillRoundedRect(this.cx - 400, this.cy - 10, 800, 20, 10); g.fillStyle(C.accent, 1).fillRoundedRect(this.cx - 400, this.cy - 10, 800 * clamp(this.cardT / this.cardMax, 0, 1), 20, 10); }
    if (this.cardT <= 0) {
      if (this.cur.truth && !this.cur.resolved) { this.msg.set('TERLEWAT!', '#ff6b35'); audio.play('lose', { volume: 0.4 }); this.cur.resolved = true; this.cardT = 0.6; return; }
      this.next();
    }
  }
}

const CNAMES = ['MERAH', 'BIRU', 'HIJAU', 'KUNING', 'UNGU'];
const CCSS = ['#ff2e3e', '#1f6fff', '#12b85a', '#f0b400', '#9b3dff'];
export class ColorTrap extends Judge {
  constructor() { super('color'); }
  bgSetup() { this.bg(0xf093fb, 0xa83279); this.vignette(); }
  gen() {
    const w = irnd(0, 4);
    const truth = Math.random() < 0.38;
    let c = w; if (!truth) while (c === w) c = irnd(0, 4);
    return { text: CNAMES[w], color: CCSS[c], truth, time: Math.max(0.9, 1.6 - this.t * 0.01) };
  }
}
export class MathQuick extends Judge {
  constructor() { super('math'); }
  bgSetup() { this.bg(0x7b4397, 0x2a1050); this.vignette(); }
  gen() {
    const lvl = Math.min(3, Math.floor(this.t / 15));
    const op = Phaser.Utils.Array.GetRandom(lvl >= 1 ? ['+', '-', '×'] : ['+', '-']);
    let a, b, r;
    if (op === '+') { a = irnd(1, 9 + lvl * 10); b = irnd(1, 9 + lvl * 8); r = a + b; }
    if (op === '-') { a = irnd(5, 15 + lvl * 10); b = irnd(1, a); r = a - b; }
    if (op === '×') { a = irnd(2, 9); b = irnd(2, 6 + lvl); r = a * b; }
    const truth = Math.random() < 0.4;
    let shown = r;
    if (!truth) { const d = Phaser.Utils.Array.GetRandom([-10, -2, -1, 1, 2, 10]); shown = Math.max(0, r + d); if (shown === r) shown = r + 1; }
    return { text: `${a} ${op} ${b} = ${shown}`, color: '#1a1033', truth, time: 1.9 };
  }
}

// ---------------------------------------------------------------- Stop at 10 seconds
export class Stop10 extends BaseGame {
  constructor() { super('stop10'); }
  setup() {
    this.bg(0x3a3a4a, 0x101018);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4).fillCircle(this.cx, this.cy + 20, 270);
    g.fillStyle(C.outline, 1).fillCircle(this.cx, this.cy, 270);
    g.fillStyle(0xffffff, 1).fillCircle(this.cx, this.cy, 250);
    for (let k = 0; k < 60; k++) { const a = k / 60 * TAU, r1 = k % 5 ? 228 : 210; g.lineStyle(k % 5 ? 4 : 8, C.outline, 1).lineBetween(this.cx + Math.cos(a) * r1, this.cy + Math.sin(a) * r1, this.cx + Math.cos(a) * 240, this.cy + Math.sin(a) * 240); }
    this.hand = this.add.graphics().setDepth(6);
    this.clock = dualText(this, '0.00', 72, '#140b2b', 100);
    this.clock.objs.forEach(o => o.setDepth(7));
    this.stopped = this.slots.map(() => null);
    this.vignette();
    this.res = [];
  }
  onDown(i) {
    if (this.stopped[i] != null) return;
    this.stopped[i] = this.t;
    audio.play('tick', { rate: 1.4 });
    const s = this.seat(i);
    const t = txt(this, s.x, s.y + (this.isTop(i) ? 210 : -210), 'BERHENTI ✓', 40, this.css(i)).setRotation(this.isTop(i) ? Math.PI : 0).setDepth(9);
    this.res[i] = t;
    if (this.stopped.every(x => x != null)) this.reveal();
  }
  cpu(i) { const p = (this.plan ??= {}); p[i] ??= 10 + Phaser.Math.Clamp((Math.random() + Math.random() + Math.random() - 1.5) * 0.7, -1.2, 1.2); if (this.t >= p[i]) this.onDown(i); }
  tick(dt) {
    const a = this.t / 10 * TAU - Math.PI / 2;
    this.hand.clear();
    if (this.t < 3) {
      this.hand.lineStyle(14, 0xff4d5e, 1).lineBetween(this.cx, this.cy, this.cx + Math.cos(a) * 200, this.cy + Math.sin(a) * 200);
      this.clock.set(this.t.toFixed(2));
    } else {
      this.hand.fillStyle(0x1a1033, 0.9).fillCircle(this.cx, this.cy, 240);
      this.clock.set('???', '#ffd23f');
    }
    this.hand.fillStyle(C.outline, 1).fillCircle(this.cx, this.cy, 18);
    if (this.t > 15 && !this.revealed) { this.slots.forEach((s, i) => { if (this.stopped[i] == null) this.stopped[i] = 99; }); this.reveal(); }
  }
  reveal() {
    if (this.revealed) return; this.revealed = true;
    this.running = false;
    const diffs = this.stopped.map(t => Math.abs(t - 10));
    const best = Math.min(...diffs);
    this.stopped.forEach((t, i) => {
      const r = this.res[i] || txt(this, 0, 0, '', 40, this.css(i));
      const s = this.seat(i);
      r.setPosition(s.x + (s.bar ? 0 : (s.x < this.cx ? 120 : -120)), s.y + (this.isTop(i) ? 230 : -230)).setRotation(this.isTop(i) ? Math.PI : 0).setDepth(9);
      r.setText(t >= 99 ? '—' : t.toFixed(2) + ' dtk').setFontSize(62);
      this.tweens.add({ targets: r, scale: { from: 0.4, to: 1 }, duration: 400, delay: i * 200, ease: 'Back.easeOut', onStart: () => audio.play('pop') });
    });
    this.clock.set('10.00', '#140b2b');
    this.time.delayedCall(1200, () => { this.running = true; this.endRound(diffs.map((d, i) => d === best && d < 50 ? i : -1).filter(i => i >= 0)); });
  }
}

// ---------------------------------------------------------------- Whack-a-mole (each player has their own field)
export class Mole extends BaseGame {
  constructor() { super('mole'); }
  setup() {
    const { W, H } = this;
    this.bg(0x7ed957, 0x3a8a2a);
    this.zones = [];
    const n = this.n;
    const rects = n <= 2 ? [[0, H / 2, W, H / 2, 0], [0, 0, W, H / 2, Math.PI]]
      : [[0, H / 2, W / 2, H / 2, 0], [W / 2, 0, W / 2, H / 2, Math.PI], [0, 0, W / 2, H / 2, Math.PI], [W / 2, H / 2, W / 2, H / 2, 0]];
    const cols = n <= 2 ? 3 : 2, rows = 3;
    this.cols = cols; this.rows = rows;
    this.score = this.slots.map(() => 0);
    for (let i = 0; i < n; i++) {
      const [x, y, w, h, rot] = rects[i];
      const c = this.add.container(x + w / 2, y + h / 2).setRotation(rot);
      const g = this.add.graphics();
      g.fillStyle(0x6fbf4a, 1).fillRoundedRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 40);
      for (let k = 0; k < 14; k++) g.fillStyle(0x62b040, 1).fillCircle(rnd(-w / 2 + 40, w / 2 - 40), rnd(-h / 2 + 40, h / 2 - 40), rnd(10, 26));
      g.lineStyle(14, PCOL[this.slots[i].p], 1).strokeRoundedRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 40);
      c.add(g);
      const holes = [];
      const gw = w - 80, gh = h - 260;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const hx = -gw / 2 + gw * (k + 0.5) / cols, hy = -h / 2 + 200 + gh * (r + 0.5) / rows;
        g.fillStyle(0x3a2410, 1).fillEllipse(hx, hy + 40, 170, 64);
        g.fillStyle(0x5b3a1f, 1).fillEllipse(hx, hy + 34, 150, 50);
        const m = this.add.image(hx, hy + 40, 'mole').setDisplaySize(140, 140).setOrigin(0.5, 1).setVisible(false);
        c.add(m);
        const cover = this.add.graphics();
        cover.fillStyle(0x6fbf4a, 1).fillRect(hx - 100, hy + 42, 200, 50);
        c.add(cover);
        holes.push({ x: hx, y: hy, m, up: 0, type: null, hit: false });
      }
      const sc = txt(this, 0, -h / 2 + 90, '0', 80, '#ffffff');
      c.add(sc);
      if (this.isCpu(i)) c.add(this.add.image(-w / 2 + 70, -h / 2 + 80, 'cpu').setDisplaySize(70, 70));
      this.zones.push({ c, holes, sc, w, h, x, y });
    }
    this.timeLeft = 30;
    this.timerT = txt(this, this.cx, this.cy, '30', 70, '#ffffff').setDepth(20);
    this.spawnT = 0.6;
    this.input.on('pointerdown', p => this.tap(p));
  }
  tap(p) {
    if (!this.running || this.ended) return;
    const zi = this.zones.findIndex(z => p.x >= z.x && p.x < z.x + z.w && p.y >= z.y && p.y < z.y + z.h);
    if (zi < 0 || this.isCpu(zi)) return;
    const z = this.zones[zi];
    const lp = z.c.pointToContainer({ x: p.x, y: p.y });
    z.holes.forEach((hh, k) => { if (Math.abs(lp.x - hh.x) < 95 && lp.y > hh.y - 130 && lp.y < hh.y + 70) this.whack(zi, k); });
  }
  whack(zi, k) {
    const z = this.zones[zi], h = z.holes[k];
    if (!h.type || h.hit) return;
    h.hit = true;
    const v = h.type === 'bomb' ? -3 : h.type === 'gold' ? 3 : 1;
    this.score[zi] = Math.max(0, this.score[zi] + v);
    z.sc.setText(String(this.score[zi]));
    this.tweens.add({ targets: z.sc, scale: { from: 1.5, to: 1 }, duration: 200 });
    if (v < 0) { audio.play('boom'); this.shake(150, 0.008); if (!this.isCpu(zi)) haptics.heavy(); h.m.setTint(0x333333); }
    else { audio.play(v > 1 ? 'gem' : 'punch'); if (!this.isCpu(zi)) haptics.light(); h.m.setTint(0xff9999); }
    const wp = z.c.getWorldTransformMatrix().transformPoint(h.x, h.y - 60);
    this.burst(wp.x, wp.y, v < 0 ? 0xff6b35 : 0xffd23f, 14);
    this.floatText(wp.x, wp.y, (v > 0 ? '+' : '') + v, v > 0 ? '#ffd23f' : '#ff4d5e', 56, z.c.rotation);
    this.tweens.add({ targets: h.m, scaleY: h.m.scaleY * 0.5, duration: 120, onComplete: () => this.hide(zi, k) });
  }
  hide(zi, k) { const h = this.zones[zi].holes[k]; h.type = null; h.m.setVisible(false).clearTint(); }
  spawn() {
    const k = irnd(0, this.cols * this.rows - 1);
    const r = Math.random();
    const type = r < 0.15 ? 'bomb' : r < 0.25 ? 'gold' : 'mole';
    const up = Math.max(0.55, 1.15 - (30 - this.timeLeft) * 0.02);
    this.zones.forEach((z, zi) => {
      const h = z.holes[k];
      if (h.type) return;
      h.type = type; h.hit = false; h.up = up;
      h.m.setTexture(type === 'bomb' ? 'bomb' : 'mole').setVisible(true).clearTint();
      if (type === 'gold') h.m.setTint(0xffe066);
      h.m.setDisplaySize(140, type === 'bomb' ? 160 : 140);
      const sy = h.m.scaleY; h.m.scaleY = 0.1;
      this.tweens.add({ targets: h.m, scaleY: sy, duration: 120, ease: 'Back.easeOut' });
      if (this.isCpu(zi)) {
        const ok = type === 'bomb' ? Math.random() < 0.06 : Math.random() < 0.8;
        if (ok) this.time.delayedCall(rnd(330, 700), () => { if (h.type === type && this.running) this.whack(zi, k); });
      }
    });
    audio.play('pop', { volume: 0.4 });
  }
  tick(dt) {
    this.timeLeft -= dt;
    this.timerT.setText(String(Math.max(0, Math.ceil(this.timeLeft))));
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = Math.max(0.4, 0.85 - (30 - this.timeLeft) * 0.012); this.spawn(); }
    this.zones.forEach((z, zi) => z.holes.forEach((h, k) => { if (h.type && !h.hit) { h.up -= dt; if (h.up <= 0) this.hide(zi, k); } }));
    if (this.timeLeft <= 0) this.finishPoints(this.score, { label: 'poin' });
  }
}

// ---------------------------------------------------------------- Stack tower (turn based)
export class Stack extends BaseGame {
  constructor() { super('stack'); }
  setup() {
    this.bg(0x43cea2, 0x185a9d);
    for (let k = 0; k < 8; k++) this.add.image(rnd(0, this.W), rnd(0, this.H), 'dot').setScale(rnd(2, 5)).setAlpha(0.08);
    this.tower = this.add.container(0, 0).setDepth(5);
    this.bh = 74;
    this.baseY = this.cy + 380;
    this.layers = [{ x: this.cx, w: 520, col: 0x5d567a }];
    this.drawBlock(this.layers[0], 0);
    this.cur = irnd(0, this.n - 1);
    this.dir = 1; this.speed = 520;
    this.moving = null;
    this.turnT = txt(this, this.cx, this.top + 60, '', 56, '#ffffff').setDepth(10);
  }
  drawBlock(L, idx) {
    const g = this.add.graphics();
    const y = this.baseY - idx * this.bh;
    g.fillStyle(C.outline, 1).fillRoundedRect(L.x - L.w / 2 - 5, y - this.bh / 2 - 5, L.w + 10, this.bh + 10, 14);
    g.fillStyle(L.col, 1).fillRoundedRect(L.x - L.w / 2, y - this.bh / 2, L.w, this.bh, 12);
    g.fillStyle(0xffffff, 0.3).fillRoundedRect(L.x - L.w / 2 + 6, y - this.bh / 2 + 6, L.w - 12, this.bh * 0.3, 8);
    this.tower.add(g);
    return g;
  }
  onStart() { this.spawn(); }
  spawn() {
    const top = this.layers[this.layers.length - 1];
    const idx = this.layers.length;
    this.dir = Math.random() < 0.5 ? 1 : -1;
    const x = this.dir > 0 ? 120 + top.w / 2 * 0 : this.W - 120;
    this.moving = { x, w: top.w, col: this.col(this.cur), idx, g: this.add.graphics().setDepth(6) };
    this.highlight(this.cur, true);
    this.turnT.setText('GILIRAN ' + this.pname(this.cur)).setColor(this.css(this.cur)).setRotation(this.isTop(this.cur) ? Math.PI : 0).setY(this.isTop(this.cur) ? this.top + 60 : this.bottom - 60);
    this.cpuErr = rnd(0, 46);
  }
  onDown(i) {
    if (i !== this.cur || !this.moving) return;
    const m = this.moving; this.moving = null;
    m.g.destroy();
    const top = this.layers[this.layers.length - 1];
    const l = Math.max(m.x - m.w / 2, top.x - top.w / 2), r = Math.min(m.x + m.w / 2, top.x + top.w / 2);
    this.highlight(i, false);
    const y = this.baseY - m.idx * this.bh + this.tower.y;
    if (r - l <= 8) {
      // missed completely
      const fall = this.add.rectangle(m.x, y, m.w, this.bh, m.col).setStrokeStyle(6, C.outline).setDepth(7);
      this.tweens.add({ targets: fall, y: this.H + 200, angle: 90 * this.dir, duration: 900, ease: 'Quad.easeIn', onComplete: () => fall.destroy() });
      this.eliminate(i, { silentCheck: true, sound: 'break' });
      this.shake(200, 0.01);
      if (this.aliveList().length <= 1) { this.time.delayedCall(700, () => this.checkLast()); return; }
    } else {
      const perfect = Math.abs(m.x - top.x) < 10;
      const L = perfect ? { x: top.x, w: top.w, col: m.col } : { x: (l + r) / 2, w: r - l, col: m.col };
      if (perfect && L.w < 520) L.w = Math.min(520, L.w + 16);
      this.layers.push(L);
      const g = this.drawBlock(L, m.idx);
      this.tweens.add({ targets: g, alpha: { from: 0.4, to: 1 }, duration: 160 });
      if (!perfect) {
        const cutW = m.w - (r - l), cx = m.x < top.x ? l - cutW / 2 : r + cutW / 2;
        const cut = this.add.rectangle(cx, y, cutW, this.bh, m.col).setStrokeStyle(6, C.outline).setDepth(7);
        this.tweens.add({ targets: cut, y: this.H + 200, angle: 60 * (m.x < top.x ? -1 : 1), duration: 900, ease: 'Quad.easeIn', onComplete: () => cut.destroy() });
        audio.play('thud');
      } else { audio.play('star'); this.floatText(this.cx, y - 60, 'SEMPURNA!', '#ffd23f', 52); this.burst(this.cx, y, 0xffffff, 20); }
      if (!this.isCpu(i)) haptics.medium();
      this.speed += 22;
      if (m.idx > 5) this.tweens.add({ targets: this.tower, y: (m.idx - 5) * this.bh, duration: 300, ease: 'Cubic.easeOut' });
    }
    const al = this.aliveList();
    let k = this.cur; do { k = (k + 1) % this.n; } while (!this.alive[k]);
    this.cur = k;
    this.time.delayedCall(450, () => { if (!this.ended) this.spawn(); });
  }
  cpu(i) {
    if (i !== this.cur || !this.moving) return;
    const top = this.layers[this.layers.length - 1];
    if (Math.abs(this.moving.x - top.x) < this.cpuErr * 0.5 + 6) this.cpuTap(i);
  }
  tick(dt) {
    const m = this.moving; if (!m) return;
    m.x += this.dir * this.speed * dt;
    if (m.x > this.W - m.w / 2 - 20) { m.x = this.W - m.w / 2 - 20; this.dir = -1; }
    if (m.x < m.w / 2 + 20) { m.x = m.w / 2 + 20; this.dir = 1; }
    const y = this.baseY - m.idx * this.bh + this.tower.y;
    const g = m.g; g.clear();
    g.fillStyle(C.outline, 1).fillRoundedRect(m.x - m.w / 2 - 5, y - this.bh / 2 - 5, m.w + 10, this.bh + 10, 14);
    g.fillStyle(m.col, 1).fillRoundedRect(m.x - m.w / 2, y - this.bh / 2, m.w, this.bh, 12);
    g.fillStyle(0xffffff, 0.3).fillRoundedRect(m.x - m.w / 2 + 6, y - this.bh / 2 + 6, m.w - 12, this.bh * 0.3, 8);
  }
}
