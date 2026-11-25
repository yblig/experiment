import Phaser from 'phaser';
import { C, PCOL, PCSS, PNAME, txt, body } from '../theme.js';
import { button, iconButton, partyBg, fadeTo, confetti, popIn } from '../ui.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';
import { native } from '../lib/native.js';
import { session, supports } from '../session.js';
import { GAMES, byId } from '../games/index.js';
import { launchGame } from './Select.js';

export class TourSetup extends Phaser.Scene {
  constructor() { super('TourSetup'); }
  create() {
    this._leaving = false;
    const { width: W, height: H } = this.scale;
    this.cameras.main.fadeIn(250, 20, 11, 43);
    partyBg(this, 0x5a3a10, 0x140b2b);
    audio.playMusic('music_menu');
    iconButton(this, 90, 100, 50, 'ic_back', { onClick: () => fadeTo(this, 'Title'), sound: 'back' });
    const tr = this.add.image(W / 2, H * 0.2, 'trophy').setDisplaySize(260, 276);
    this.tweens.add({ targets: tr, y: H * 0.2 - 18, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    txt(this, W / 2, H * 0.2 + 210, 'TURNAMEN', 120, '#ffd23f', { st: 18 });
    body(this, W / 2, H * 0.2 + 310, '5 game acak berturut-turut. Menang = dapat piala.\nPiala terbanyak jadi JUARA!', 38, '#ffeccc', { wrap: 900 });
    this.games = 5;
    const y0 = H * 0.2 + 470;
    body(this, W / 2, y0, 'Berapa pemain?', 44, '#ffffff');
    for (let k = 0; k < 4; k++) {
      const x = W / 2 + (k - 1.5) * 230;
      const b = button(this, x, y0 + 150, 200, 200, String(k + 1), { color: PCOL[k], size: 110, onClick: () => this.start(k + 1) });
      popIn(this, b, k * 80);
    }
    const gy = y0 + 380;
    this.gLabel = body(this, W / 2, gy, '', 40, '#ffffff');
    const setG = (n) => { this.games = n; this.gLabel.setText(`Jumlah game: ${n}`); };
    button(this, W / 2 - 300, gy, 140, 110, '−', { color: C.panel, size: 80, onClick: () => setG(Math.max(3, this.games - 1)) });
    button(this, W / 2 + 300, gy, 140, 110, '+', { color: C.panel, size: 80, onClick: () => setG(Math.min(10, this.games + 1)) });
    setG(5);
    const off = native.onBack(() => { fadeTo(this, 'Title'); return true; });
    this.events.once('shutdown', off);
  }
  start(n) {
    const pool = Phaser.Utils.Array.Shuffle(GAMES.filter(g => supports(g, n)).map(g => g.id));
    session.humans = n;
    session.tour = { humans: n, games: pool.slice(0, this.games), idx: 0, trophies: [0, 0, 0, 0], counted: false };
    fadeTo(this, 'Tour');
  }
}

export class Tour extends Phaser.Scene {
  constructor() { super('Tour'); }
  create() {
    this._leaving = false;
    const { width: W, height: H } = this.scale;
    const t = session.tour;
    this.cameras.main.fadeIn(250, 20, 11, 43);
    partyBg(this, 0x5a3a10, 0x140b2b);
    const players = t.humans === 1 ? 4 : t.humans;
    const final = t.idx >= t.games.length;
    iconButton(this, 90, 100, 50, 'ic_home', { onClick: () => fadeTo(this, 'Title'), sound: 'back' });
    txt(this, W / 2, 110, final ? 'JUARA TURNAMEN' : `GAME ${t.idx + 1} DARI ${t.games.length}`, final ? 80 : 72, '#ffd23f');

    // standings
    const order = [0, 1, 2, 3].slice(0, players).sort((a, b) => t.trophies[b] - t.trophies[a]);
    const best = t.trophies[order[0]];
    const champs = order.filter(p => t.trophies[p] === best);
    const sy = final ? H * 0.5 : 300;
    order.forEach((p, r) => {
      const y = sy + r * 130;
      const g = this.add.graphics();
      g.fillStyle(C.outline, 1).fillRoundedRect(W / 2 - 430, y - 56, 860, 112, 40);
      g.fillStyle(final && champs.includes(p) ? PCOL[p] : C.panel, 1).fillRoundedRect(W / 2 - 424, y - 50, 848, 100, 36);
      this.add.image(W / 2 - 350, y, 'char_' + p).setDisplaySize(84, 84);
      txt(this, W / 2 - 290, y, PNAME[p] + (p >= t.humans ? ' (CPU)' : ''), 44, '#ffffff', { ox: 0 });
      for (let k = 0; k < t.trophies[p]; k++) this.add.image(W / 2 + 380 - k * 62, y, 'trophy').setDisplaySize(56, 60);
      if (!t.trophies[p]) body(this, W / 2 + 380, y, '–', 44, '#a99bd6', { ox: 1 });
    });

    if (final) {
      const cx = W / 2;
      champs.forEach((p, k) => {
        const x = cx + (k - (champs.length - 1) / 2) * 250;
        const c = this.add.image(x, H * 0.3, 'char_' + p).setDisplaySize(230, 230);
        const cr = this.add.image(x, H * 0.3 - 145, 'crown').setDisplaySize(160, 120);
        popIn(this, c, 200); popIn(this, cr, 500);
      });
      txt(this, cx, H * 0.3 + 170, champs.length === 1 ? PNAME[champs[0]] + ' JUARA!' : 'JUARA BERSAMA!', 90, champs.length === 1 ? PCSS[champs[0]] : '#ffd23f');
      audio.play('levelup'); audio.playMusic('music_win');
      this.time.delayedCall(300, () => { confetti(this, cx, H * 0.3, 160); haptics.success(); });
      this.time.delayedCall(1300, () => confetti(this, cx, H * 0.3, 100));
      button(this, cx, H - 330, 760, 150, 'TURNAMEN BARU', { color: C.green, icon: 'ic_retry', onClick: () => fadeTo(this, 'TourSetup') });
      button(this, cx, H - 150, 520, 120, 'MENU', { color: C.panel, icon: 'ic_home', size: 48, onClick: () => fadeTo(this, 'Title') });
      session.tour = null;
    } else {
      audio.playMusic('music_menu');
      // roulette reveal of the next game
      const meta = byId[t.games[t.idx]];
      const ry = sy + players * 130 + 330;
      const frame = this.add.graphics();
      frame.fillStyle(C.outline, 1).fillRoundedRect(W / 2 - 230, ry - 230, 460, 460, 70);
      frame.fillStyle(0xffd23f, 1).fillRoundedRect(W / 2 - 220, ry - 220, 440, 440, 64);
      const ic = this.add.image(W / 2, ry, 'gi_random').setDisplaySize(380, 380);
      const name = txt(this, W / 2, ry + 290, '???', 76, '#ffffff');
      let k = 0; const icons = GAMES.map(g => g.icon);
      const spin = this.time.addEvent({ delay: 80, repeat: 18, callback: () => {
        k++; ic.setTexture(icons[Phaser.Math.Between(0, icons.length - 1)]).setDisplaySize(380, 380); audio.play('tick');
        if (spin.getRepeatCount() === 0) {
          ic.setTexture(meta.icon).setDisplaySize(380, 380); name.setText(meta.name);
          audio.play('star'); haptics.medium();
          this.tweens.add({ targets: ic, scale: { from: ic.scale * 1.3, to: ic.scale }, duration: 400, ease: 'Back.easeOut' });
          const b = button(this, W / 2, Math.min(H - 150, ry + 480), 700, 160, 'MULAI!', { color: C.green, icon: 'ic_play', onClick: () => launchGame(this, meta, t) });
          popIn(this, b, 100);
        }
      } });
    }
    const off = native.onBack(() => { fadeTo(this, 'Title'); return true; });
    this.events.once('shutdown', off);
  }
}
