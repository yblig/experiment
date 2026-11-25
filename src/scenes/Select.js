import Phaser from 'phaser';
import { C, PCOL, txt, body, darken } from '../theme.js';
import { iconButton, partyBg, fadeTo } from '../ui.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';
import { native } from '../lib/native.js';
import { session, slotsFor, supports, stats } from '../session.js';
import { GAMES, CATS } from '../games/index.js';

export function launchGame(scene, meta, tour = null) {
  const slots = slotsFor(meta, tour ? tour.humans : session.humans);
  fadeTo(scene, meta.id, { meta, slots, tour });
}

export default class Select extends Phaser.Scene {
  constructor() { super('Select'); }
  create() {
    this._leaving = false;
    const { width: W, height: H } = this.scale;
    this.W = W; this.H = H;
    this.cameras.main.fadeIn(250, 20, 11, 43);
    partyBg(this, 0x2d1b5a, 0x140b2b);
    audio.playMusic('music_menu');
    const hn = session.humans;

    // grid
    this.headerH = 400;
    this.content = this.add.container(0, 0);
    const maskG = this.make.graphics({ add: false }).fillStyle(0xffffff).fillRect(0, this.headerH - 20, W, H - this.headerH + 20);
    this.content.setMask(maskG.createGeometryMask());
    this.buildGrid();

    // header (drawn after so it stays on top)
    const hg = this.add.graphics();
    hg.fillStyle(C.outline, 0.96).fillRect(0, 0, W, this.headerH - 24);
    hg.fillStyle(C.surface, 1).fillRect(0, 0, W, this.headerH - 34);
    iconButton(this, 90, 100, 50, 'ic_back', { onClick: () => this.goBack(), sound: 'back' });
    txt(this, W / 2, 100, 'PILIH GAME', 80, '#ffffff');
    const chip = this.add.graphics();
    chip.fillStyle(C.outline, 1).fillRoundedRect(W - 235, 62, 200, 76, 38);
    chip.fillStyle(PCOL[hn - 1], 1).fillRoundedRect(W - 230, 66, 190, 66, 33);
    txt(this, W - 135, 100, hn + ' PEMAIN', 36);
    // category tabs
    this.tabs = [];
    const tw = (W - 60) / CATS.length;
    CATS.forEach((c, k) => {
      const x = 30 + tw * k + tw / 2, y = 250;
      const g = this.add.graphics();
      const t = body(this, x, y, c.name, c.id === 'otak' ? 30 : 34, '#ffffff', { wrap: tw - 10 });
      const z = this.add.zone(x, y, tw - 8, 100).setInteractive();
      z.on('pointerup', () => { if (session.cat !== c.id) { session.cat = c.id; session.scrollY = 0; audio.play('select'); haptics.tap(); this.scene.restart(); } });
      this.tabs.push({ g, t, x, y, w: tw - 12, id: c.id });
    });
    this.drawTabs();
    body(this, W / 2, 336, hn === 1 ? 'Kamu lawan CPU. Pegang tombol MERAH.' : 'Letakkan HP di meja, tiap pemain pegang satu sisi.', 28, '#bfb0f0');

    this.input.on('pointerdown', (p) => { if (p.y < this.headerH) return; this.drag = { y0: p.y, c0: this.content.y, moved: false, t: p.time }; this.vel = 0; this.lastY = p.y; });
    this.input.on('pointermove', (p) => {
      if (!this.drag || !p.isDown) return;
      const dy = p.y - this.drag.y0;
      if (Math.abs(dy) > 16) this.drag.moved = true;
      if (this.drag.moved) { this.vel = (p.y - this.lastY); this.lastY = p.y; this.content.y = this.clampY(this.drag.c0 + dy, true); }
    });
    this.input.on('pointerup', (p) => {
      if (!this.drag) return;
      const d = this.drag; this.drag = null;
      if (!d.moved) this.tapAt(p.x, p.y - this.content.y);
    });
    this.content.y = this.clampY(session.scrollY || 0);
    const offBack = native.onBack(() => { this.goBack(); return true; });
    this.events.once('shutdown', () => { offBack(); session.scrollY = this.content.y; });
  }
  drawTabs() {
    this.tabs.forEach(tb => {
      const on = tb.id === session.cat;
      tb.g.clear();
      tb.g.fillStyle(C.outline, 1).fillRoundedRect(tb.x - tb.w / 2 - 4, tb.y - 46, tb.w + 8, 92, 30);
      tb.g.fillStyle(on ? C.accent : C.panel, 1).fillRoundedRect(tb.x - tb.w / 2, tb.y - 42, tb.w, 84, 26);
      tb.t.setAlpha(on ? 1 : 0.75);
    });
  }
  clampY(y, soft) {
    const min = Math.min(0, this.H - this.gridBottom - 60);
    if (soft) { if (y > 0) return y * 0.4; if (y < min) return min + (y - min) * 0.4; return y; }
    return Phaser.Math.Clamp(y, min, 0);
  }
  update(t, dt) {
    if (!this.drag) {
      if (Math.abs(this.vel) > 0.5) { this.content.y += this.vel * dt / 16; this.vel *= Math.pow(0.92, dt / 16); }
      const c = this.clampY(this.content.y);
      if (c !== this.content.y) { this.content.y += (c - this.content.y) * 0.25; this.vel = 0; if (Math.abs(c - this.content.y) < 1) this.content.y = c; }
    }
  }
  buildGrid() {
    const W = this.W, cols = 3, gap = 26, cw = (W - 60 - gap * (cols - 1)) / cols, ch = 400;
    const list = [{ id: '__random', name: 'ACAK!', icon: 'gi_random', min: 1, max: 4, random: true }, ...GAMES.filter(g => session.cat === 'all' || g.cat === session.cat)];
    this.cards = [];
    list.forEach((m, k) => {
      const col = k % cols, row = Math.floor(k / cols);
      const x = 30 + col * (cw + gap) + cw / 2, y = this.headerH + 40 + row * (ch + gap) + ch / 2;
      const ok = m.random || supports(m, session.humans);
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.3).fillRoundedRect(-cw / 2, -ch / 2 + 14, cw, ch, 40);
      g.fillStyle(C.outline, 1).fillRoundedRect(-cw / 2 - 5, -ch / 2 - 5, cw + 10, ch + 10, 44);
      g.fillStyle(m.random ? 0xff6b35 : C.panel, 1).fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 40);
      g.fillStyle(0xffffff, 0.07).fillRoundedRect(-cw / 2 + 10, -ch / 2 + 10, cw - 20, ch * 0.5, 32);
      c.add(g);
      const ic = this.add.image(0, -ch / 2 + 140, m.icon).setDisplaySize(230, 230);
      c.add(ic);
      c.add(txt(this, 0, ch / 2 - 110, m.name, m.name.length > 12 ? 38 : 44, '#ffffff', { wrap: cw - 24, ls: -6 }));
      if (!m.random) {
        const bg2 = this.add.graphics();
        bg2.fillStyle(0x000000, 0.35).fillRoundedRect(-62, ch / 2 - 58, 124, 44, 22);
        c.add(bg2);
        c.add(body(this, 0, ch / 2 - 36, `1-${m.max} P`, 28, '#ffd23f', { st: 3 }));
        if (stats.plays(m.id) > 0) c.add(this.add.image(cw / 2 - 30, -ch / 2 + 30, 'star').setDisplaySize(44, 44));
      } else {
        c.add(body(this, 0, ch / 2 - 36, 'game kejutan', 26, '#fff0c0', { st: 3 }));
        this.tweens.add({ targets: ic, angle: { from: -8, to: 8 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      if (!ok) {
        c.setAlpha(0.45);
        const lk = this.add.graphics();
        lk.fillStyle(C.outline, 0.85).fillRoundedRect(-cw / 2 + 20, -40, cw - 40, 80, 30);
        c.add(lk);
        c.add(body(this, 0, 0, `maks ${m.max} pemain`, 30, '#ffffff'));
      }
      c.setScale(0.8).setAlpha(0);
      this.tweens.add({ targets: c, scale: 1, alpha: ok ? 1 : 0.45, duration: 300, delay: 40 + k * 25, ease: 'Back.easeOut' });
      this.content.add(c);
      this.cards.push({ c, m, ok, x, y, w: cw, h: ch });
    });
    const last = this.cards[this.cards.length - 1];
    this.gridBottom = last.y + last.h / 2;
  }
  tapAt(x, y) {
    const hit = this.cards.find(k => Math.abs(k.x - x) < k.w / 2 && Math.abs(k.y - y) < k.h / 2);
    if (!hit) return;
    if (!hit.ok) { audio.play('wrong'); haptics.error(); this.tweens.add({ targets: hit.c, x: hit.x + 14, duration: 50, yoyo: true, repeat: 3 }); return; }
    audio.play('select'); haptics.tap();
    this.tweens.add({ targets: hit.c, scale: 0.92, duration: 90, yoyo: true });
    let meta = hit.m;
    if (meta.random) {
      const pool = GAMES.filter(g => supports(g, session.humans));
      meta = pool[Phaser.Math.Between(0, pool.length - 1)];
    }
    this.time.delayedCall(140, () => launchGame(this, meta));
  }
  goBack() { audio.play('back'); fadeTo(this, 'Title'); }
}
