import Phaser from 'phaser';
import { C, PCOL, txt, body } from '../theme.js';
import { button, iconButton, partyBg, fadeTo, popIn } from '../ui.js';
import { audio } from '../lib/audio.js';
import { native } from '../lib/native.js';
import { session, stats } from '../session.js';
import { GAMES } from '../games/index.js';

export default class Title extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    this._leaving = false;
    const { width: W, height: H } = this.scale;
    this.cameras.main.fadeIn(300, 20, 11, 43);
    partyBg(this);
    native.hideSplash();
    audio.playMusic('music_menu');
    audio.duckMusic(false);

    // bouncing mascots in the background
    for (let k = 0; k < 8; k++) {
      const s = this.add.image(Phaser.Math.Between(80, W - 80), Phaser.Math.Between(200, H - 200), 'char_' + (k % 4)).setDisplaySize(90, 90).setAlpha(0.22);
      const vx = Phaser.Math.Between(-140, 140), vy = Phaser.Math.Between(-140, 140);
      s.v = { x: vx || 80, y: vy || 80 };
      (this.floaters ||= []).push(s);
    }

    const top = Math.max(300, (H - 1520) / 2 + 210);
    const logo = this.add.image(W / 2, top, 'logo').setDisplaySize(860, 400);
    this.tweens.add({ targets: logo, y: top - 16, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const t1 = txt(this, W / 2, top + 210, 'PESTA PEMAIN', 116, '#ffd23f', { st: 18 });
    this.tweens.add({ targets: t1, angle: { from: -2, to: 2 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    body(this, W / 2, top + 310, `${GAMES.length} mini game  •  1 HP  •  tanpa internet`, 38, '#d9ccff');

    const gy = top + 560;
    const names = ['1 PEMAIN', '2 PEMAIN', '3 PEMAIN', '4 PEMAIN'];
    const subs = ['lawan CPU', 'berhadapan', 'bertiga', 'berempat'];
    for (let k = 0; k < 4; k++) {
      const x = W / 2 + (k % 2 ? 235 : -235), y = gy + Math.floor(k / 2) * 330;
      const b = button(this, x, y, 440, 270, '', { color: PCOL[k], onClick: () => this.pick(k + 1) });
      b.labelText.setText('');
      b.top.add(txt(this, 0, -8, names[k], 72));
      b.top.add(body(this, 0, 62, subs[k], 34, '#ffffff', { st: 4 }));
      for (let j = 0; j <= k; j++) {
        const cx = (j - k / 2) * 62;
        b.top.add(this.add.image(cx, -92, k === 0 && j === 0 ? 'char_0' : 'char_' + j).setDisplaySize(62, 62));
      }
      if (k === 0) b.top.add(this.add.image(62, -92, 'cpu').setDisplaySize(58, 58));
      popIn(this, b, 120 + k * 80);
    }
    const ty = gy + 660;
    const tb = button(this, W / 2, ty, 900, 150, 'TURNAMEN', { color: 0xf7a823, icon: 'ic_trophy', onClick: () => fadeTo(this, 'TourSetup') });
    popIn(this, tb, 500);
    this.tweens.add({ targets: tb, scale: 1.04, duration: 700, yoyo: true, repeat: -1, delay: 900, ease: 'Sine.easeInOut' });

    iconButton(this, W - 90, 90, 52, 'ic_gear', { onClick: () => this.openSettings() });
    const st = stats.get();
    body(this, W / 2, H - 70, `Sudah ${st.matches} pertandingan dimainkan`, 30, '#a99bd6');

    const offBack = native.onBack(() => false);
    this.events.once('shutdown', offBack);
  }
  pick(n) {
    session.humans = n;
    session.tour = null;
    fadeTo(this, 'Select');
  }
  openSettings() {
    this.scene.pause();
    this.scene.launch('Settings', { from: 'Title' });
  }
  update(t, dt) {
    const { width: W, height: H } = this.scale;
    (this.floaters || []).forEach(s => {
      s.x += s.v.x * dt / 1000; s.y += s.v.y * dt / 1000; s.rotation += s.v.x * dt / 100000;
      if (s.x < 40 || s.x > W - 40) s.v.x *= -1;
      if (s.y < 40 || s.y > H - 40) s.v.y *= -1;
    });
  }
}
