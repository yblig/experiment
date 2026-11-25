import Phaser from 'phaser';
import { C, PCOL, PDARK, PCSS, PNAME, txt, body, darken } from '../theme.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';
import { native } from '../lib/native.js';
import { iconButton } from '../ui.js';

const TAU = Math.PI * 2;
export { TAU };

// Shared frame for every mini game: seats & player buttons, CPU driving, countdown,
// rounds, banners, pause, results hand-off. A game overrides:
//   setup()            build the round
//   tick(dt)           per-frame update while running (dt in seconds)
//   onDown(i)/onUp(i)  player i's button pressed/released
//   cpu(i, dt)         drive CPU slot i (call this.cpuTap(i) / this.setDown(i, v))
//   onStart()          after countdown
export default class BaseGame extends Phaser.Scene {
  init(data) {
    // scene.restart() reuses this object: wipe state left over from the previous round
    if (!this._baseKeys) this._baseKeys = new Set([...Object.keys(this), '_baseKeys']);
    else for (const k of Object.keys(this)) if (!this._baseKeys.has(k)) delete this[k];
    this.d = data;
    this.meta = data.meta;
    this.slots = data.slots;
    this.n = this.slots.length;
    this.need = this.meta.wins ?? 3;
    this.wins = data.wins ? [...data.wins] : this.slots.map(() => 0);
    this.round = data.round || 1;
    this._leaving = false;
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W; this.H = H; this.cx = W / 2; this.cy = H / 2;
    this.top = 250; this.bottom = H - 250;
    this.down = this.slots.map(() => false);
    this.alive = this.slots.map(() => true);
    this.running = false; this.ended = false; this.t = 0;
    this.btns = [];
    this.cameras.main.fadeIn(220, 20, 11, 43);
    this.fx = this.add.particles(0, 0, 'spark', {
      speed: { min: 150, max: 650 }, scale: { start: 1.6, end: 0 }, lifespan: 600,
      rotate: { min: 0, max: 360 }, emitting: false
    }).setDepth(40);
    this.setup();
    if ((this.meta.controls || 'button') === 'button') this.makeButtons();
    this.pauseBtn = iconButton(this, 62, this.cy, 40, 'ic_pause', { color: C.panel, onClick: () => this.openPause() }).setDepth(60).setAlpha(0.85);
    this.input.on('pointerup', (p) => this.btns.forEach((b, i) => { if (b && b.pid === p.id) this.release(i); }));
    const offBack = native.onBack(() => { this.openPause(); return true; });
    window.__activeGame = this;
    this.events.once('shutdown', () => { offBack(); if (window.__activeGame === this) window.__activeGame = null; this.tweens.killAll(); });
    audio.playMusic(this.meta.music || 'music_game');
    audio.duckMusic(false);
    this.intro();
  }

  // ---------- seats ----------
  seat(i, n = this.n) {
    const { W, H } = this;
    if (n <= 2) return i === 0 ? { x: W / 2, y: H - 118, rot: 0, bar: true } : { x: W / 2, y: 118, rot: Math.PI, bar: true };
    const m = 150;
    return [{ x: m, y: H - m, rot: 0 }, { x: W - m, y: m, rot: Math.PI }, { x: m, y: m, rot: Math.PI }, { x: W - m, y: H - m, rot: 0 }][i];
  }
  seatAngle(i) { const s = this.seat(i); return Math.atan2(s.y - this.cy, s.x - this.cx); }
  isTop(i) { return this.seat(i).rot !== 0; }
  col(i) { return PCOL[this.slots[i].p]; }
  dark(i) { return PDARK[this.slots[i].p]; }
  css(i) { return PCSS[this.slots[i].p]; }
  pname(i) { return PNAME[this.slots[i].p]; }
  isCpu(i) { return this.slots[i].cpu; }

  makeButtons() {
    for (let i = 0; i < this.n; i++) {
      const s = this.seat(i);
      const c = this.add.container(s.x, s.y).setRotation(s.rot).setDepth(30);
      const g = this.add.graphics();
      c.add(g);
      const cpu = this.isCpu(i);
      const label = txt(this, 0, 0, cpu ? 'CPU' : 'P' + (this.slots[i].p + 1), s.bar ? 64 : 58);
      c.add(label);
      if (cpu) { const ci = this.add.image(0, 0, 'cpu').setDisplaySize(60, 60); c.add(ci); c.cpuIcon = ci; }
      c.g = g; c.label = label; c.seat = s; c.pid = null;
      c.pips = this.add.container(0, 0); c.add(c.pips);
      if (s.bar) { label.x = -this.W * 0.28; if (cpu) { c.cpuIcon.x = label.x - 100; } }
      else { label.y = -30; if (cpu) { c.cpuIcon.setDisplaySize(54, 54); label.setFontSize(34); } }
      this.btns[i] = c;
      this.drawBtn(i);
      this.drawPips(i);
      if (!cpu) {
        const hit = s.bar ? new Phaser.Geom.Rectangle(-this.W * 0.47, -105, this.W * 0.94, 210) : new Phaser.Geom.Circle(0, 0, 150);
        c.setInteractive(hit, s.bar ? Phaser.Geom.Rectangle.Contains : Phaser.Geom.Circle.Contains);
        c.on('pointerdown', (p) => { c.pid = p.id; this.press(i); });
      }
    }
  }
  drawBtn(i, pressed = false) {
    const c = this.btns[i]; if (!c) return;
    const g = c.g, s = c.seat, col = this.col(i);
    const dead = !this.alive[i];
    const fill = dead ? 0x4a4460 : col;
    g.clear();
    const d = pressed ? 8 : 0;
    if (s.bar) {
      const w = this.W * 0.88, h = 160, r = 50;
      g.fillStyle(0x000000, 0.3).fillRoundedRect(-w / 2, -h / 2 + 18, w, h, r);
      g.fillStyle(C.outline, 1).fillRoundedRect(-w / 2 - 6, -h / 2 - 6 + d, w + 12, h + 12 + 14 - d, r + 4);
      g.fillStyle(darken(fill, 25), 1).fillRoundedRect(-w / 2, -h / 2 + 14, w, h, r);
      g.fillStyle(pressed ? Phaser.Display.Color.IntegerToColor(fill).lighten(12).color : fill, 1).fillRoundedRect(-w / 2, -h / 2 + d, w, h, r);
      g.fillStyle(0xffffff, 0.22).fillRoundedRect(-w / 2 + 14, -h / 2 + 10 + d, w - 28, 50, 26);
    } else {
      const r = 112;
      g.fillStyle(0x000000, 0.3).fillCircle(0, 18, r);
      g.fillStyle(C.outline, 1).fillCircle(0, 7 + d / 2, r + 6);
      g.fillStyle(darken(fill, 25), 1).fillCircle(0, 14, r);
      g.fillStyle(pressed ? Phaser.Display.Color.IntegerToColor(fill).lighten(12).color : fill, 1).fillCircle(0, d, r);
      g.fillStyle(0xffffff, 0.22).fillEllipse(-r * 0.15, -r * 0.5 + d, r * 1.3, r * 0.55);
    }
    c.label.y = (s.bar ? 0 : (this.isCpu(i) ? 2 : -30)) + d;
    if (c.cpuIcon) c.cpuIcon.y = (s.bar ? 0 : -54) + d;
    c.pips.y = d;
    c.label.setAlpha(dead ? 0.5 : 1);
  }
  drawPips(i, scoreText) {
    const c = this.btns[i]; if (!c) return;
    c.pips.removeAll(true);
    const s = c.seat;
    if (scoreText !== undefined || this.need <= 1) {
      if (scoreText === undefined) return;
      const t = txt(this, s.bar ? this.W * 0.2 : 0, s.bar ? 0 : 44, String(scoreText), s.bar ? 70 : 54, '#ffffff');
      c.pips.add(t);
      return;
    }
    const k = this.need, gap = s.bar ? 74 : (k > 3 ? 36 : 46), sz = s.bar ? 62 : (k > 3 ? 34 : 42);
    for (let j = 0; j < k; j++) {
      const x = (s.bar ? this.W * 0.16 : 0) + (j - (k - 1) / 2) * gap;
      const y = s.bar ? 0 : (this.isCpu(i) ? 52 : 44);
      const st = this.add.image(x, y, 'star').setDisplaySize(sz, sz);
      if (j >= this.wins[i]) st.setTint(0x2a1f4a).setAlpha(0.7);
      c.pips.add(st);
    }
  }
  setScore(i, v) { this.drawPips(i, v); }
  // small score label just inside a player's seat, readable from their side
  tag(i, v) {
    this._tags ||= [];
    let t = this._tags[i];
    if (!t) {
      const st = this.seat(i), inward = st.rot ? 1 : -1;
      t = txt(this, st.x, st.y + inward * (st.bar ? 160 : 185), '', 52, this.css(i)).setRotation(st.rot).setDepth(31);
      this._tags[i] = t;
    }
    t.setText(String(v));
    this.tweens.add({ targets: t, scale: { from: 1.4, to: 1 }, duration: 250, ease: 'Back.easeOut' });
  }
  highlight(i, on) {
    const c = this.btns[i]; if (!c) return;
    if (c.hl) { c.hl.destroy(); c.hl = null; }
    if (on) {
      const s = c.seat;
      c.hl = this.add.image(s.x, s.y, 'glow').setDisplaySize(s.bar ? this.W * 1.1 : 420, s.bar ? 380 : 420).setTint(this.col(i)).setDepth(29).setBlendMode('ADD');
      this.tweens.add({ targets: c.hl, alpha: { from: 1, to: 0.4 }, duration: 500, yoyo: true, repeat: -1 });
    }
  }

  // ---------- input ----------
  press(i) { this.setDown(i, true); }
  release(i) { if (this.btns[i]) this.btns[i].pid = null; this.setDown(i, false); }
  setDown(i, v) {
    if (this.down[i] === v) return;
    this.down[i] = v;
    if (this.btns[i]) {
      this.drawBtn(i, v);
      if (v && !this.isCpu(i)) haptics.tap();
    }
    if (!this.running || this.ended) return;
    if (!this.alive[i] && !this.meta.deadInput) return;
    if (v) this.onDown(i); else this.onUp(i);
  }
  cpuTap(i, ms = 70) {
    if (this.down[i]) return;
    this.setDown(i, true);
    this.time.delayedCall(ms, () => this.setDown(i, false));
  }
  onDown() {} onUp() {} cpu() {} tick() {} onStart() {}

  update(time, delta) {
    if (!this.running || this.ended) return;
    const dt = Math.min(delta, 40) / 1000;
    this.t += dt;
    for (let i = 0; i < this.n; i++) if (this.isCpu(i) && this.alive[i]) this.cpu(i, dt);
    this.tick(dt);
  }

  // ---------- flow ----------
  intro() {
    const { cx, cy } = this;
    if (this.round === 1) {
      const w = 880, h = 500;
      const mk = (y, rot, sc) => {
        const card = this.add.container(cx, y).setDepth(70).setRotation(rot).setScale(sc);
        const g = this.add.graphics();
        g.fillStyle(0x000000, 0.4).fillRoundedRect(-w / 2, -h / 2 + 14, w, h, 50);
        g.fillStyle(C.outline, 1).fillRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 54);
        g.fillStyle(C.surface, 0.97).fillRoundedRect(-w / 2, -h / 2, w, h, 50);
        card.add(g);
        card.add(this.add.image(-w / 2 + 130, -h / 2 + 130, this.meta.icon).setDisplaySize(190, 190));
        card.add(txt(this, 60, -h / 2 + 100, this.meta.name, this.meta.name.length > 15 ? 52 : 70, '#ffd23f', { wrap: 600 }));
        card.add(body(this, 60, -h / 2 + 180, this.need > 1 ? `Menang ${this.need} ronde` : 'Satu babak', 32, '#c9b8ff'));
        card.add(body(this, 0, 90, this.meta.how, 40, '#ffffff', { wrap: w - 90 }));
        return card;
      };
      const two = this.n >= 2;
      const card = mk(two ? cy + 215 : cy, 0, two ? 0.78 : 1);
      const card2 = two ? mk(cy - 215, Math.PI, 0.78) : null;
      [card, card2].forEach(o => { if (!o) return; const s0 = o.scale; o.setScale(s0 * 0.6).setAlpha(0); this.tweens.add({ targets: o, scale: s0, alpha: 1, duration: 380, ease: 'Back.easeOut' }); });
      audio.play('whoosh');
      this.time.delayedCall(2600, () => {
        [card, card2].forEach(o => o && this.tweens.add({ targets: o, alpha: 0, scale: o.scale * 0.8, duration: 220, onComplete: () => o.destroy() }));
        this.countdown();
      });
    } else {
      this.bigText('RONDE ' + this.round, '#ffd23f', 110, 900);
      this.time.delayedCall(950, () => this.countdown());
    }
  }
  countdown() {
    const seq = ['3', '2', '1', 'MULAI!'];
    seq.forEach((s, k) => this.time.delayedCall(k * 520, () => {
      const last = k === seq.length - 1;
      audio.play(last ? 'go' : 'countdown');
      if (last) haptics.medium();
      this.bigText(s, last ? '#2fd27a' : '#ffffff', last ? 150 : 200, 480);
      if (last) { this.running = true; this.onStart(); }
    }));
  }
  bigText(s, color, size, life = 700) {
    const objs = [txt(this, this.cx, this.cy, s, size, color).setDepth(80)];
    if (this.n >= 2 && s.length <= 1) { /* digits read fine both ways */ }
    else if (this.n >= 2) { objs[0].y = this.cy + 110; objs.push(txt(this, this.cx, this.cy - 110, s, size, color).setDepth(80).setRotation(Math.PI)); }
    objs.forEach(o => {
      o.setScale(0.3); o.alpha = 0;
      this.tweens.add({ targets: o, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
      this.tweens.add({ targets: o, alpha: 0, scale: 1.25, delay: life - 200, duration: 200, onComplete: () => o.destroy() });
    });
  }
  banner(s, colorCss = '#ffffff', sub) {
    const mk = (y, rot) => {
      const c = this.add.container(this.cx, y).setDepth(85).setRotation(rot);
      const g = this.add.graphics();
      g.fillStyle(C.outline, 0.92).fillRoundedRect(-500, -110, 1000, sub ? 220 : 180, 60);
      c.add(g);
      c.add(txt(this, 0, sub ? -30 : -20, s, 96, colorCss));
      if (sub) c.add(body(this, 0, 60, sub, 40, '#e8e0ff'));
      c.setScale(0.2).setAngle(c.angle + 12);
      this.tweens.add({ targets: c, scale: 1, angle: rot ? 180 : 0, duration: 420, ease: 'Back.easeOut' });
      return c;
    };
    mk(this.n >= 2 ? this.cy + 170 : this.cy, 0);
    if (this.n >= 2) mk(this.cy - 170, Math.PI);
  }

  eliminate(i, { sound = 'hurt', silentCheck = false } = {}) {
    if (!this.alive[i]) return;
    this.alive[i] = false;
    this.down[i] = false;
    audio.play(sound === 'hurt' ? 'hit' : sound);
    if (!this.isCpu(i)) haptics.heavy();
    this.drawBtn(i);
    if (this.btns[i]) this.tweens.add({ targets: this.btns[i], scale: { from: 1.12, to: 1 }, duration: 300 });
    if (!silentCheck) this.time.delayedCall(450, () => this.checkLast());
  }
  aliveList() { return this.alive.map((a, i) => a ? i : -1).filter(i => i >= 0); }
  checkLast() {
    if (this.ended) return;
    const al = this.aliveList();
    if (al.length === 1) this.endRound(al[0]);
    else if (al.length === 0) this.endRound(-1);
  }

  endRound(w) {
    if (this.ended) return;
    this.ended = true; this.running = false;
    const ws = Array.isArray(w) ? w : (w >= 0 ? [w] : []);
    ws.forEach(k => this.wins[k]++);
    if (ws.length) {
      const name = ws.length === 1 ? this.pname(ws[0]) : (this.meta.team ? 'TIM ' + this.pname(ws[0]) : ws.map(k => this.pname(k)).join(' & '));
      this.banner(name + (this.need > 1 ? ' DAPAT POIN!' : ' MENANG!'), this.css(ws[0]));
      audio.play('star'); haptics.success();
      this.burst(this.cx, this.cy, this.col(ws[0]), 40);
    } else { this.banner('SERI!', '#ffffff', 'Tidak ada yang dapat poin'); audio.play('lose'); }
    for (let i = 0; i < this.n; i++) this.drawPips(i);
    const done = this.wins.some(x => x >= this.need);
    this.time.delayedCall(2000, () => {
      if (done) {
        const best = Math.max(...this.wins);
        this.toResults(this.wins, this.wins.map((x, i) => x === best ? i : -1).filter(i => i >= 0), 'wins');
      } else {
        this.scene.restart({ ...this.d, wins: this.wins, round: this.round + 1 });
      }
    });
  }
  // Single-round games with a score: finishPoints([5,3,..]) — highest wins unless lowerBetter
  finishPoints(scores, { lowerBetter = false, label } = {}) {
    if (this.ended) return;
    this.ended = true; this.running = false;
    const best = lowerBetter ? Math.min(...scores) : Math.max(...scores);
    const winners = scores.map((x, i) => x === best ? i : -1).filter(i => i >= 0);
    if (winners.length === 1) this.banner(this.pname(winners[0]) + ' MENANG!', this.css(winners[0]));
    else this.banner('SERI!', '#ffffff');
    audio.play('star');
    this.time.delayedCall(2000, () => this.toResults(scores, winners, 'points', { lowerBetter, label }));
  }
  toResults(scores, winners, mode, extra = {}) {
    if (this._leaving) return;
    this._leaving = true;
    if (this.meta.team && winners.length === 1) {
      // team games: both members of the winning team win
      const team = this.teamOf(winners[0]);
      winners = this.slots.map((s, i) => this.teamOf(i) === team ? i : -1).filter(i => i >= 0);
    }
    this.cameras.main.fadeOut(250, 20, 11, 43);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Results', {
      meta: this.meta, slots: this.slots, scores, winners, mode, tour: this.d.tour, ...extra
    }));
  }
  teamOf(i) { return this.n <= 2 ? i : ((i === 0 || i === 3) ? 0 : 1); }

  openPause() {
    if (this.ended || this._leaving || !this.scene.isActive()) return;
    audio.duckMusic(true);
    this.scene.pause();
    this.scene.launch('Pause', { from: this.scene.key, d: this.d });
  }

  // ---------- juice ----------
  burst(x, y, color = 0xffffff, count = 18) {
    this.fx.setParticleTint(color);
    this.fx.explode(count, x, y);
  }
  shake(ms = 140, k = 0.008) { this.cameras.main.shake(ms, k); }
  floatText(x, y, s, color = '#ffffff', size = 56, rot = 0) {
    const t = txt(this, x, y, s, size, color).setDepth(45).setRotation(rot);
    const dy = rot ? 90 : -90;
    this.tweens.add({ targets: t, y: y + dy, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
    return t;
  }
  // game-area background helpers
  bg(c1, c2) {
    const g = this.add.graphics();
    g.fillGradientStyle(c1, c1, c2, c2, 1).fillRect(0, 0, this.W, this.H);
    return g;
  }
  vignette() { return this.add.image(this.cx, this.cy, 'vignette').setDisplaySize(this.W, this.H).setDepth(20).setAlpha(0.7); }
}

export const rnd = Phaser.Math.FloatBetween;
export const irnd = Phaser.Math.Between;
export const clamp = Phaser.Math.Clamp;
export const angDiff = (a, b) => Phaser.Math.Angle.Wrap(a - b);
