import Phaser from 'phaser';
import BaseGame, { TAU, rnd, irnd, clamp } from './BaseGame.js';
import { C, PCOL, PCSS, PNAME, txt, body } from '../theme.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';

// turn label shown at both ends of the phone
function turnLabels(sc) {
  const a = txt(sc, sc.cx, sc.H - 120, '', 58, '#ffffff').setDepth(20);
  const b = txt(sc, sc.cx, 120, '', 58, '#ffffff').setDepth(20).setRotation(Math.PI);
  return { set(s, c) { [a, b].forEach(t => t.setText(s).setColor(c)); [a, b].forEach(t => sc.tweens.add({ targets: t, scale: { from: 1.25, to: 1 }, duration: 250, ease: 'Back.easeOut' })); }, a, b };
}

// ---------------------------------------------------------------- Memory
const FACES = ['coin', 'star', 'bomb', 'ball', 'crown', 'trophy', 'target', 'mole', 'meteor', 'rps_1'];
export class Memory extends BaseGame {
  constructor() { super('memory'); }
  setup() {
    const { W, H } = this;
    this.bg(0x4facfe, 0x3a1c71);
    const cols = 4, rows = 5;
    const cw = Math.min(230, (W - 100) / cols - 16), ch = Math.min(cw * 1.12, (H - 560) / rows - 16);
    const deck = Phaser.Utils.Array.Shuffle([...FACES, ...FACES]);
    this.cards = deck.map((f, k) => {
      const c = k % cols, r = Math.floor(k / cols);
      const x = this.cx + (c - (cols - 1) / 2) * (cw + 16), y = this.cy + (r - (rows - 1) / 2) * (ch + 16);
      const con = this.add.container(x, y).setDepth(5);
      const back = this.add.graphics();
      back.fillStyle(0x000000, 0.3).fillRoundedRect(-cw / 2, -ch / 2 + 10, cw, ch, 26);
      back.fillStyle(C.outline, 1).fillRoundedRect(-cw / 2 - 5, -ch / 2 - 5, cw + 10, ch + 10, 30);
      back.fillStyle(0xff6b35, 1).fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 26);
      back.fillStyle(0xffffff, 0.15).fillRoundedRect(-cw / 2 + 8, -ch / 2 + 8, cw - 16, ch * 0.35, 18);
      const q = txt(this, 0, 0, '?', 90, '#ffffff');
      const front = this.add.graphics();
      front.fillStyle(C.outline, 1).fillRoundedRect(-cw / 2 - 5, -ch / 2 - 5, cw + 10, ch + 10, 30);
      front.fillStyle(0xffffff, 1).fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 26);
      const im = this.add.image(0, 0, f).setDisplaySize(cw * 0.62, cw * 0.62);
      const fr = this.add.container(0, 0, [front, im]).setVisible(false);
      con.add([back, q, fr]);
      return { f, x, y, w: cw, h: ch, con, back, q, fr, open: false, done: false };
    });
    this.score = this.slots.map(() => 0);
    this.known = new Map();
    this.cur = 0; this.picks = []; this.busy = false;
    this.lbl = turnLabels(this);
    this.scoreT = body(this, this.cx, this.H - 50, '', 32, '#ffffff').setDepth(20);
    this.scoreT2 = body(this, this.cx, 50, '', 32, '#ffffff').setDepth(20).setRotation(Math.PI);
    this.updateLabels();
    this.input.on('pointerdown', p => {
      if (!this.running || this.busy || this.isCpu(this.cur)) return;
      const k = this.cards.findIndex(c => Math.abs(p.x - c.x) < c.w / 2 && Math.abs(p.y - c.y) < c.h / 2);
      if (k >= 0) this.flip(k);
    });
  }
  updateLabels() {
    this.lbl.set('GILIRAN ' + this.pname(this.cur), this.css(this.cur));
    const s = this.slots.map((s, i) => `${this.pname(i)}: ${this.score[i]}`).join('   ');
    this.scoreT.setText(s); this.scoreT2.setText(s);
  }
  onStart() { if (this.isCpu(this.cur)) this.cpuTurn(); }
  flip(k) {
    const c = this.cards[k];
    if (c.open || c.done || this.picks.length >= 2) return;
    c.open = true; this.picks.push(k);
    audio.play('flip');
    this.tweens.add({ targets: c.con, scaleX: 0, duration: 110, onComplete: () => { c.back.setVisible(false); c.q.setVisible(false); c.fr.setVisible(true); this.tweens.add({ targets: c.con, scaleX: 1, duration: 110 }); } });
    this.slots.forEach((s, i) => { if (this.isCpu(i) && Math.random() < 0.75) this.known.set(k, c.f); });
    if (this.picks.length === 2) {
      this.busy = true;
      const [a, b] = this.picks.map(i => this.cards[i]);
      this.time.delayedCall(700, () => {
        if (a.f === b.f) {
          a.done = b.done = true; this.score[this.cur]++;
          audio.play('correct'); this.burst(a.x, a.y, this.col(this.cur), 16); this.burst(b.x, b.y, this.col(this.cur), 16);
          [a, b].forEach(c => { c.fr.list[0].clear().fillStyle(C.outline, 1).fillRoundedRect(-c.w / 2 - 5, -c.h / 2 - 5, c.w + 10, c.h + 10, 30).fillStyle(this.col(this.cur), 1).fillRoundedRect(-c.w / 2, -c.h / 2, c.w, c.h, 26); this.tweens.add({ targets: c.con, scale: { from: 1.15, to: 1 }, duration: 300 }); });
          this.known.delete(this.picks[0]); this.known.delete(this.picks[1]);
          if (!this.isCpu(this.cur)) haptics.success();
        } else {
          audio.play('wrong', { volume: 0.5 });
          [a, b].forEach(c => this.tweens.add({ targets: c.con, scaleX: 0, duration: 110, onComplete: () => { c.back.setVisible(true); c.q.setVisible(true); c.fr.setVisible(false); c.open = false; this.tweens.add({ targets: c.con, scaleX: 1, duration: 110 }); } }));
          this.cur = (this.cur + 1) % this.n;
        }
        this.picks = []; this.busy = false;
        this.updateLabels();
        if (this.cards.every(c => c.done)) { this.time.delayedCall(400, () => this.finishPoints(this.score, { label: 'pasang' })); return; }
        if (this.isCpu(this.cur)) this.time.delayedCall(450, () => this.cpuTurn());
      });
    }
  }
  cpuTurn() {
    if (this.ended || !this.isCpu(this.cur)) return;
    const open = this.cards.map((c, k) => (!c.done && !c.open) ? k : -1).filter(k => k >= 0);
    const known = [...this.known.entries()].filter(([k]) => !this.cards[k].done);
    let pair = null;
    for (let x = 0; x < known.length && !pair; x++) for (let y = x + 1; y < known.length; y++) if (known[x][1] === known[y][1]) { pair = [known[x][0], known[y][0]]; break; }
    let first = pair && Math.random() < 0.9 ? pair[0] : open[irnd(0, open.length - 1)];
    this.time.delayedCall(500, () => {
      this.flip(first);
      const f = this.cards[first].f;
      const mate = [...this.known.entries()].find(([k, v]) => v === f && k !== first && !this.cards[k].done);
      const rest = open.filter(k => k !== first);
      const second = mate && Math.random() < 0.85 ? mate[0] : rest[irnd(0, rest.length - 1)];
      this.time.delayedCall(650, () => this.flip(second));
    });
  }
}

// ---------------------------------------------------------------- Tic tac toe
export class XO extends BaseGame {
  constructor() { super('xo'); }
  setup() {
    this.bg(0xa18cd1, 0x5b3a9a);
    this.cs = 280;
    const g = this.add.graphics();
    const s = this.cs * 3;
    g.fillStyle(0x000000, 0.25).fillRoundedRect(this.cx - s / 2 - 30, this.cy - s / 2 - 14, s + 60, s + 60, 50);
    g.fillStyle(C.outline, 1).fillRoundedRect(this.cx - s / 2 - 36, this.cy - s / 2 - 36, s + 72, s + 72, 56);
    g.fillStyle(0xfff6ff, 1).fillRoundedRect(this.cx - s / 2 - 28, this.cy - s / 2 - 28, s + 56, s + 56, 50);
    g.lineStyle(14, 0xc9b8ff, 1);
    for (let k = 1; k < 3; k++) { g.lineBetween(this.cx - s / 2 + k * this.cs, this.cy - s / 2 + 10, this.cx - s / 2 + k * this.cs, this.cy + s / 2 - 10); g.lineBetween(this.cx - s / 2 + 10, this.cy - s / 2 + k * this.cs, this.cx + s / 2 - 10, this.cy - s / 2 + k * this.cs); }
    this.b = Array(9).fill(-1);
    this.cur = (this.round - 1) % 2;
    this.lbl = turnLabels(this);
    this.lbl.set('GILIRAN ' + this.pname(this.cur), this.css(this.cur));
    this.input.on('pointerdown', p => {
      if (!this.running || this.isCpu(this.cur) || this.busy) return;
      const c = Math.floor((p.x - (this.cx - s / 2)) / this.cs), r = Math.floor((p.y - (this.cy - s / 2)) / this.cs);
      if (c >= 0 && c < 3 && r >= 0 && r < 3) this.play(r * 3 + c);
    });
  }
  onStart() { if (this.isCpu(this.cur)) this.time.delayedCall(500, () => this.cpuMove()); }
  cellXY(k) { const s = this.cs * 3; return [this.cx - s / 2 + (k % 3 + 0.5) * this.cs, this.cy - s / 2 + (Math.floor(k / 3) + 0.5) * this.cs]; }
  play(k) {
    if (this.b[k] !== -1 || this.ended) return;
    this.b[k] = this.cur;
    const [x, y] = this.cellXY(k);
    const g = this.add.graphics({ x, y }).setDepth(5);
    const r = this.cs * 0.32;
    if (this.cur === 0) { g.lineStyle(44, C.outline, 1).lineBetween(-r, -r, r, r).lineBetween(r, -r, -r, r); g.lineStyle(30, this.col(0), 1).lineBetween(-r, -r, r, r).lineBetween(r, -r, -r, r); }
    else { g.lineStyle(44, C.outline, 1).strokeCircle(0, 0, r); g.lineStyle(30, this.col(1), 1).strokeCircle(0, 0, r); }
    g.setScale(0); this.tweens.add({ targets: g, scale: 1, duration: 260, ease: 'Back.easeOut' });
    audio.play('pop'); if (!this.isCpu(this.cur)) haptics.tap();
    const w = this.winner(this.b);
    if (w) {
      const [a, , c] = w.line; const [x1, y1] = this.cellXY(a), [x2, y2] = this.cellXY(c);
      const lg = this.add.graphics().setDepth(6).lineStyle(26, 0xffd23f, 1).lineBetween(x1, y1, x2, y2);
      this.endRound(w.p); return;
    }
    if (this.b.every(v => v !== -1)) { this.endRound(-1); return; }
    this.cur = 1 - this.cur;
    this.lbl.set('GILIRAN ' + this.pname(this.cur), this.css(this.cur));
    if (this.isCpu(this.cur)) { this.busy = true; this.time.delayedCall(550, () => { this.busy = false; this.cpuMove(); }); }
  }
  winner(b) {
    const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const l of L) if (b[l[0]] !== -1 && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { p: b[l[0]], line: l };
    return null;
  }
  mm(b, p, me) {
    const w = this.winner(b); if (w) return w.p === me ? 10 : -10;
    if (b.every(v => v !== -1)) return 0;
    let best = p === me ? -99 : 99;
    for (let k = 0; k < 9; k++) if (b[k] === -1) { b[k] = p; const v = this.mm(b, 1 - p, me) * 0.9; b[k] = -1; best = p === me ? Math.max(best, v) : Math.min(best, v); }
    return best;
  }
  cpuMove() {
    if (this.ended) return;
    const free = this.b.map((v, k) => v === -1 ? k : -1).filter(k => k >= 0);
    let move;
    if (Math.random() < 0.18) move = free[irnd(0, free.length - 1)];
    else { let bv = -999; for (const k of free) { this.b[k] = this.cur; const v = this.mm(this.b, 1 - this.cur, this.cur) + rnd(0, 0.01); this.b[k] = -1; if (v > bv) { bv = v; move = k; } } }
    this.play(move);
  }
}

// ---------------------------------------------------------------- Connect four
export class Connect4 extends BaseGame {
  constructor() { super('connect4'); }
  setup() {
    this.bg(0x3d8bff, 0x14306a);
    this.C = 7; this.R = 6; this.cs = 140;
    const bw = this.cs * this.C, bh = this.cs * this.R;
    this.bx = this.cx - bw / 2; this.by = this.cy - bh / 2 + 40;
    this.discs = this.add.container(0, 0).setDepth(4);
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x000000, 0.3).fillRoundedRect(this.bx - 26, this.by - 10, bw + 52, bh + 50, 40);
    g.fillStyle(C.outline, 1).fillRoundedRect(this.bx - 30, this.by - 30, bw + 60, bh + 60, 44);
    // board with holes via path
    g.fillStyle(0x1f5fc9, 1);
    g.fillRoundedRect(this.bx - 22, this.by - 22, bw + 44, bh + 44, 38);
    const holes = this.add.graphics().setDepth(5);
    for (let c = 0; c < this.C; c++) for (let r = 0; r < this.R; r++) {
      const [x, y] = this.xy(c, r);
      holes.fillStyle(C.outline, 1).fillCircle(x, y, 56);
      holes.fillStyle(0x0c1a4a, 1).fillCircle(x, y, 50);
    }
    this.holesG = holes;
    this.b = Array.from({ length: this.C }, () => []);
    this.cur = (this.round - 1) % 2;
    this.lbl = turnLabels(this);
    this.lbl.set('GILIRAN ' + this.pname(this.cur), this.css(this.cur));
    this.input.on('pointerdown', p => {
      if (!this.running || this.isCpu(this.cur) || this.busy) return;
      const c = Math.floor((p.x - this.bx) / this.cs);
      if (c >= 0 && c < this.C && p.y > this.by - 300 && p.y < this.by + this.cs * this.R + 100) this.drop(c);
    });
  }
  xy(c, r) { return [this.bx + (c + 0.5) * this.cs, this.by + (this.R - r - 0.5) * this.cs]; }
  onStart() { if (this.isCpu(this.cur)) this.time.delayedCall(500, () => this.cpuMove()); }
  drop(c) {
    if (this.b[c].length >= this.R || this.ended || this.busy) return;
    const r = this.b[c].length;
    this.b[c].push(this.cur);
    const [x, y] = this.xy(c, r);
    const d = this.add.circle(x, this.by - 120, 50, this.col(this.cur)).setStrokeStyle(8, C.outline).setDepth(6);
    const hl = this.add.circle(x - 14, this.by - 134, 14, 0xffffff, 0.45).setDepth(6);
    this.busy = true;
    const who = this.cur;
    this.tweens.add({ targets: [d, hl], y: `+=${y - this.by + 120}`, duration: 140 + (this.R - r) * 55, ease: 'Bounce.easeOut', onComplete: () => {
      this.busy = false;
      audio.play('thud', { rate: 1.2 }); if (!this.isCpu(who)) haptics.light();
      const line = this.check(this.b, c, r);
      if (line) { line.forEach(([cc, rr]) => { const [lx, ly] = this.xy(cc, rr); const s = this.add.image(lx, ly, 'star').setDisplaySize(70, 70).setDepth(7); this.tweens.add({ targets: s, scale: { from: 0, to: s.scale }, duration: 300, ease: 'Back.easeOut' }); }); this.endRound(who); return; }
      if (this.b.every(col => col.length >= this.R)) { this.endRound(-1); return; }
      this.cur = 1 - this.cur;
      this.lbl.set('GILIRAN ' + this.pname(this.cur), this.css(this.cur));
      if (this.isCpu(this.cur)) this.time.delayedCall(450, () => this.cpuMove());
    } });
    audio.play('slide', { volume: 0.4 });
  }
  at(b, c, r) { return c >= 0 && c < this.C && r >= 0 && r < this.R ? (b[c][r] ?? -1) : -2; }
  check(b, c, r) {
    const p = b[c][r];
    for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const cells = [[c, r]];
      for (const s of [1, -1]) { let k = 1; while (this.at(b, c + dc * k * s, r + dr * k * s) === p) { cells.push([c + dc * k * s, r + dr * k * s]); k++; } }
      if (cells.length >= 4) return cells;
    }
    return null;
  }
  wouldWin(b, c, p) { if (b[c].length >= this.R) return false; b[c].push(p); const w = !!this.check(b, c, b[c].length - 1); b[c].pop(); return w; }
  cpuMove() {
    if (this.ended) return;
    const me = this.cur, op = 1 - me, b = this.b;
    const legal = [...Array(this.C).keys()].filter(c => b[c].length < this.R);
    let move = legal.find(c => this.wouldWin(b, c, me));
    if (move === undefined && Math.random() < 0.92) move = legal.find(c => this.wouldWin(b, c, op));
    if (move === undefined) {
      let bs = -1e9;
      for (const c of legal) {
        let s = 6 - Math.abs(3 - c) * 1.5 + rnd(0, 2.5);
        b[c].push(me);
        if (legal.some(c2 => this.wouldWin(b, c2, op))) s -= 50;
        const r = b[c].length - 1;
        for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { let n = 1; for (const sg of [1, -1]) { let k = 1; while (this.at(b, c + dc * k * sg, r + dr * k * sg) === me) { n++; k++; } } s += n * n; }
        b[c].pop();
        if (s > bs) { bs = s; move = c; }
      }
    }
    this.drop(move);
  }
}

// ---------------------------------------------------------------- Snakes & ladders
const LADDERS = { 3: 22, 8: 30, 28: 84, 58: 77, 71: 91, 80: 99 };
const SNAKES = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79 };
export class Ladder extends BaseGame {
  constructor() { super('ladder'); }
  setup() {
    const { W } = this;
    this.bg(0xf9d423, 0xc0501a);
    this.cs = Math.min((W - 60) / 10, (this.bottom - this.top - 200) / 10);
    this.bx = this.cx - this.cs * 5; this.by = this.cy - this.cs * 5 - 40;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3).fillRoundedRect(this.bx - 20, this.by - 6, this.cs * 10 + 40, this.cs * 10 + 40, 30);
    g.fillStyle(C.outline, 1).fillRoundedRect(this.bx - 22, this.by - 22, this.cs * 10 + 44, this.cs * 10 + 44, 30);
    const cols = [0xfff6e0, 0xffd18a, 0xffe7b8, 0xffc070];
    for (let n = 1; n <= 100; n++) {
      const [x, y] = this.xy(n);
      g.fillStyle(cols[(n + Math.floor((n - 1) / 10)) % 2 ? 0 : 1], 1).fillRect(x - this.cs / 2, y - this.cs / 2, this.cs, this.cs);
    }
    for (let n = 1; n <= 100; n++) { const [x, y] = this.xy(n); body(this, x - this.cs / 2 + 6, y - this.cs / 2 + 4, String(n), 22, '#8a5a2a', { ox: 0, oy: 0, st: 0 }); }
    const lg = this.add.graphics().setDepth(2);
    Object.entries(LADDERS).forEach(([a, b]) => {
      const [x1, y1] = this.xy(+a), [x2, y2] = this.xy(b);
      const ang = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(ang) * 20, ny = Math.cos(ang) * 20;
      lg.lineStyle(14, C.outline, 1).lineBetween(x1 + nx, y1 + ny, x2 + nx, y2 + ny).lineBetween(x1 - nx, y1 - ny, x2 - nx, y2 - ny);
      lg.lineStyle(8, 0xb07a3a, 1).lineBetween(x1 + nx, y1 + ny, x2 + nx, y2 + ny).lineBetween(x1 - nx, y1 - ny, x2 - nx, y2 - ny);
      const L = Math.hypot(x2 - x1, y2 - y1);
      for (let d = 24; d < L - 10; d += 32) { const px = x1 + Math.cos(ang) * d, py = y1 + Math.sin(ang) * d; lg.lineStyle(7, 0x8a5a2a, 1).lineBetween(px + nx, py + ny, px - nx, py - ny); }
    });
    const sg = this.add.graphics().setDepth(3);
    const scol = [0x2fd27a, 0xb06ab3, 0xff6b35, 0x3d8bff];
    Object.entries(SNAKES).forEach(([a, b], k) => {
      const [x1, y1] = this.xy(+a), [x2, y2] = this.xy(b);
      const mx = (x1 + x2) / 2 + (k % 2 ? 60 : -60), my = (y1 + y2) / 2;
      const curve = new Phaser.Curves.CubicBezier(new Phaser.Math.Vector2(x1, y1), new Phaser.Math.Vector2(mx + 80, y1 + (y2 - y1) * 0.3), new Phaser.Math.Vector2(mx - 80, y1 + (y2 - y1) * 0.7), new Phaser.Math.Vector2(x2, y2));
      const pts = curve.getPoints(30);
      sg.lineStyle(26, C.outline, 1).strokePoints(pts); sg.lineStyle(16, scol[k % 4], 1).strokePoints(pts);
      sg.lineStyle(5, 0xffffff, 0.35).strokePoints(pts.slice(2, -2));
      sg.fillStyle(C.outline, 1).fillCircle(x1, y1, 22); sg.fillStyle(scol[k % 4], 1).fillCircle(x1, y1, 17);
      sg.fillStyle(0xffffff, 1).fillCircle(x1 - 6, y1 - 5, 5).fillCircle(x1 + 6, y1 - 5, 5);
      sg.fillStyle(C.outline, 1).fillCircle(x1 - 6, y1 - 5, 2.5).fillCircle(x1 + 6, y1 - 5, 2.5);
    });
    this.pos = this.slots.map(() => 0);
    this.tok = this.slots.map((s, i) => this.add.image(this.bx + this.cs * 0.6 + i * 70, this.by + this.cs * 10 + 80, 'char_' + s.p).setDisplaySize(this.cs * 0.62, this.cs * 0.62).setDepth(8));
    this.dice = this.add.container(this.cx, this.by + this.cs * 10 + 110).setDepth(10);
    const dg = this.add.graphics();
    dg.fillStyle(C.outline, 1).fillRoundedRect(-62, -62, 124, 124, 26); dg.fillStyle(0xffffff, 1).fillRoundedRect(-55, -55, 110, 110, 22);
    this.pips = this.add.graphics();
    this.dice.add([dg, this.pips]);
    this.drawDie(1);
    this.cur = 0; this.busy = false;
    this.turnT = txt(this, this.cx, this.by - 70, '', 50, '#ffffff').setDepth(10);
    this.turnT2 = null;
  }
  xy(n) {
    if (n <= 0) return [this.bx + this.cs * 0.6, this.by + this.cs * 10 + 80];
    const k = n - 1, row = Math.floor(k / 10), col = row % 2 ? 9 - (k % 10) : k % 10;
    return [this.bx + (col + 0.5) * this.cs, this.by + (9 - row + 0.5) * this.cs];
  }
  drawDie(v) {
    const g = this.pips; g.clear(); g.fillStyle(C.outline, 1);
    const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v];
    P.forEach(([x, y]) => g.fillCircle(x * 28, y * 28, 11));
  }
  onStart() { this.turn(); }
  turn() {
    if (this.ended) return;
    this.slots.forEach((s, i) => this.highlight(i, i === this.cur));
    this.turnT.setText('GILIRAN ' + this.pname(this.cur) + ' — tekan tombolmu').setColor(this.css(this.cur)).setFontSize(42);
    if (this.isCpu(this.cur)) this.time.delayedCall(700, () => this.onDown(this.cur));
  }
  onDown(i) {
    if (i !== this.cur || this.busy || this.ended) return;
    this.busy = true;
    const v = irnd(1, 6);
    let k = 0;
    audio.play('slide');
    this.time.addEvent({ delay: 60, repeat: 8, callback: () => { k++; this.drawDie(k < 9 ? irnd(1, 6) : v); this.dice.angle = k < 9 ? rnd(-20, 20) : 0; if (k === 9) { this.drawDie(v); audio.play('pop'); this.move(i, v); } } });
  }
  move(i, v) {
    const steps = [];
    for (let s = 1; s <= v; s++) steps.push(Math.min(100, this.pos[i] + s));
    const hop = (j) => {
      if (j >= steps.length) return this.land(i, v);
      this.pos[i] = steps[j];
      const [x, y] = this.xy(this.pos[i]);
      const off = (i - (this.n - 1) / 2) * 10;
      this.tweens.add({ targets: this.tok[i], x: x + off, y: y + off, duration: 150, ease: 'Sine.easeOut', onComplete: () => { audio.play('tap', { volume: 0.5, rate: 1 + j * 0.05 }); hop(j + 1); } });
      this.tweens.add({ targets: this.tok[i], scale: this.tok[i].scale * 1.25, duration: 75, yoyo: true });
    };
    hop(0);
  }
  land(i, v) {
    const p = this.pos[i];
    const to = LADDERS[p] || SNAKES[p];
    const finish = () => {
      if (this.pos[i] >= 100) { this.burst(this.tok[i].x, this.tok[i].y, this.col(i), 50); this.endRound(i); return; }
      this.busy = false;
      if (v === 6) { this.floatText(this.cx, this.by - 140, 'DADU 6! LAGI!', '#ffd23f', 50); }
      else { let k = this.cur; k = (k + 1) % this.n; this.cur = k; }
      this.time.delayedCall(250, () => this.turn());
    };
    if (to) {
      const up = to > p;
      audio.play(up ? 'levelup' : 'lose');
      this.floatText(this.tok[i].x, this.tok[i].y - 50, up ? 'NAIK!' : 'ULAR!', up ? '#2fd27a' : '#ff4d5e', 50);
      this.pos[i] = to;
      const [x, y] = this.xy(to);
      this.tweens.add({ targets: this.tok[i], x, y, duration: 700, ease: 'Sine.easeInOut', onComplete: finish });
      if (!this.isCpu(i)) up ? haptics.success() : haptics.error();
    } else finish();
  }
}

// ---------------------------------------------------------------- Rock paper scissors
const RPS_NAME = ['BATU', 'KERTAS', 'GUNTING'];
export class RPS extends BaseGame {
  constructor() { super('rps'); }
  setup() {
    this.bg(0xff758c, 0x8a2a6a);
    this.vignette();
    this.choice = this.slots.map(() => null);
    this.zones = this.slots.map((s, i) => {
      const st = this.seat(i);
      const c = this.add.container(st.x, st.y).setRotation(st.rot).setDepth(10);
      const btns = [];
      const sx = (st.x < this.cx ? 1 : -1) * (st.rot ? -1 : 1);
      const P = st.bar ? [[-300, 0], [0, 0], [300, 0]] : [[0, 0], [sx * 220, 0], [0, -220]];
      [0, 1, 2].forEach(k => {
        const [x, y] = P[k];
        const g = this.add.graphics();
        g.fillStyle(C.outline, 1).fillCircle(x, y + 6, 98); g.fillStyle(this.dark(i), 1).fillCircle(x, y + 8, 92); g.fillStyle(this.col(i), 1).fillCircle(x, y, 92);
        g.fillStyle(0xffffff, 0.2).fillEllipse(x - 10, y - 40, 120, 50);
        const im = this.add.image(x, y, 'rps_' + k).setDisplaySize(130, 130);
        c.add([g, im]);
        btns.push({ x, y, g, im });
      });
      const lbl = txt(this, st.bar ? 0 : sx * 110, st.bar ? -150 : -330, this.isCpu(i) ? 'CPU' : 'P' + (s.p + 1), 44, this.css(i));
      c.add(lbl);
      return { c, btns, st };
    });
    this.input.on('pointerdown', p => this.tap(p));
    this.reveal = this.add.container(0, 0).setDepth(30);
    this.mid = txt(this, this.cx, this.cy, '', 100, '#ffffff').setDepth(31);
    this.mid2 = this.n >= 2 ? txt(this, this.cx, this.cy - 150, '', 100, '#ffffff').setDepth(31).setRotation(Math.PI) : null;
    if (this.mid2) this.mid.y = this.cy + 150;
  }
  tap(p) {
    if (!this.running || this.revealing) return;
    this.zones.forEach((z, i) => {
      if (this.isCpu(i) || this.choice[i] != null) return;
      const lp = z.c.pointToContainer({ x: p.x, y: p.y });
      z.btns.forEach((b, k) => { if (Math.hypot(lp.x - b.x, lp.y - b.y) < 100) this.pick(i, k); });
    });
  }
  pick(i, k) {
    this.choice[i] = k;
    audio.play('select'); if (!this.isCpu(i)) haptics.tap();
    const z = this.zones[i];
    z.btns.forEach(b => { b.im.setVisible(false); b.g.setAlpha(0.35); });
    const ok = txt(this, z.btns[0].x, z.btns[0].y, 'SIAP ✓', 44, '#ffffff');
    z.c.add(ok); z.ok = ok;
    if (this.choice.every(c => c != null)) this.doReveal();
  }
  onStart() {
    this.setMid('PILIH!');
    this.slots.forEach((s, i) => { if (this.isCpu(i)) this.time.delayedCall(rnd(500, 1500), () => this.pick(i, irnd(0, 2))); });
  }
  setMid(s, c = '#ffffff') { [this.mid, this.mid2].forEach(t => t && t.setText(s).setColor(c)); [this.mid, this.mid2].forEach(t => t && this.tweens.add({ targets: t, scale: { from: 1.4, to: 1 }, duration: 220, ease: 'Back.easeOut' })); }
  doReveal() {
    this.revealing = true;
    ['BATU...', 'GUNTING...', 'KERTAS!'].forEach((s, k) => this.time.delayedCall(k * 420, () => { this.setMid(s); audio.play(k < 2 ? 'countdown' : 'go'); }));
    this.time.delayedCall(1300, () => {
      this.zones.forEach((z, i) => {
        z.ok?.destroy();
        const st = z.st;
        const toC = Math.atan2(this.cy - st.y, this.cx - st.x);
        const x = st.x + Math.cos(toC) * (st.bar ? 330 : 360), y = st.y + Math.sin(toC) * (st.bar ? 330 : 360);
        const im = this.add.image(x, y, 'rps_' + this.choice[i]).setDisplaySize(230, 230).setRotation(st.rot).setDepth(32);
        const bgc = this.add.circle(x, y, 140, this.col(i), 0.9).setStrokeStyle(10, C.outline).setDepth(31);
        [im, bgc].forEach(o => this.tweens.add({ targets: o, scale: { from: 0, to: o.scale }, duration: 300, ease: 'Back.easeOut' }));
      });
      const types = new Set(this.choice);
      if (types.size !== 2) { this.setMid('SERI!', '#ffd23f'); this.time.delayedCall(1200, () => this.endRound(-1)); return; }
      const [a, b] = [...types];
      const beats = (x, y) => (x === 0 && y === 2) || (x === 1 && y === 0) || (x === 2 && y === 1);
      const win = beats(a, b) ? a : b;
      this.setMid(RPS_NAME[win] + ' MENANG!', '#ffd23f');
      const ws = this.choice.map((c, i) => c === win ? i : -1).filter(i => i >= 0);
      this.time.delayedCall(1200, () => this.endRound(ws));
    });
  }
}
