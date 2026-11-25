import Phaser from 'phaser';
import { C, PCOL, PCSS, PNAME, txt, body } from '../theme.js';
import { button, iconButton, partyBg, fadeTo, confetti, popIn } from '../ui.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';
import { native } from '../lib/native.js';
import { session, stats } from '../session.js';
import { launchGame } from './Select.js';

export default class Results extends Phaser.Scene {
  constructor() { super('Results'); }
  create(d) {
    this._leaving = false;
    this.d = d;
    const { width: W, height: H } = this.scale;
    const { meta, slots, scores, winners, mode, tour } = d;
    this.cameras.main.fadeIn(250, 20, 11, 43);
    const wcol = winners.length === 1 ? PCOL[slots[winners[0]].p] : C.surface;
    partyBg(this, Phaser.Display.Color.IntegerToColor(wcol).darken(30).color, 0x140b2b);
    stats.recordMatch(meta.id, winners.length === 1 || meta.team ? winners.map(w => slots[w].p) : []);
    if (tour && !tour.counted) {
      winners.forEach(w => { tour.trophies[slots[w].p]++; });
      tour.counted = true;
    }
    audio.stopMusic(0.2);
    const humanWon = winners.some(w => !slots[w].cpu);
    this.time.delayedCall(250, () => { audio.play(winners.length && (humanWon || session.humans > 1) ? 'win' : 'lose'); audio.playMusic('music_win'); });

    // rays behind winner
    const rays = this.add.graphics({ x: W / 2, y: H * 0.3 });
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; rays.fillStyle(0xffffff, 0.07).slice(0, 0, 900, a, a + 0.12).fillPath(); }
    this.tweens.add({ targets: rays, angle: 360, duration: 30000, repeat: -1 });

    this.add.image(W / 2, H * 0.09, meta.icon).setDisplaySize(130, 130);
    body(this, W / 2, H * 0.09 + 95, meta.name, 36, '#e8e0ff');
    let title, tcol = '#ffd23f';
    if (winners.length === 1) { title = PNAME[slots[winners[0]].p] + ' MENANG!'; tcol = PCSS[slots[winners[0]].p]; }
    else if (meta.team && winners.length === 2) { title = 'TIM ' + PNAME[slots[winners[0]].p] + ' MENANG!'; tcol = PCSS[slots[winners[0]].p]; }
    else title = 'SERI!';
    const tt = txt(this, W / 2, H * 0.19, title, title.length > 13 ? 92 : 110, tcol, { st: 18 });
    popIn(this, tt, 150);

    // winner(s) big with crown
    const wy = H * 0.34;
    const shown = winners.length ? winners : [];
    shown.forEach((w, k) => {
      const x = W / 2 + (k - (shown.length - 1) / 2) * 260;
      const c = this.add.image(x, wy, 'char_' + slots[w].p).setDisplaySize(240, 240);
      const cr = this.add.image(x, wy - 150, 'crown').setDisplaySize(170, 128);
      popIn(this, c, 300 + k * 100); popIn(this, cr, 600 + k * 100);
      this.tweens.add({ targets: c, y: wy - 24, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 900 });
      this.tweens.add({ targets: cr, y: wy - 174, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 900 });
    });
    if (!shown.length) {
      const c = this.add.image(W / 2, wy, 'trophy').setDisplaySize(220, 234); popIn(this, c, 300);
    }
    if (winners.length) this.time.delayedCall(500, () => { confetti(this, W / 2, H * 0.36, 120); haptics.success(); });

    // scoreboard
    const order = slots.map((s, i) => i).sort((a, b) => d.lowerBetter ? scores[a] - scores[b] : scores[b] - scores[a]);
    const by = H * 0.5;
    order.forEach((i, r) => {
      const y = by + r * 128;
      const s = slots[i];
      const row = this.add.container(W / 2, y);
      const g = this.add.graphics();
      g.fillStyle(C.outline, 1).fillRoundedRect(-420, -56, 840, 112, 40);
      g.fillStyle(winners.includes(i) ? PCOL[s.p] : C.panel, 1).fillRoundedRect(-414, -50, 828, 100, 36);
      g.fillStyle(0xffffff, 0.12).fillRoundedRect(-404, -44, 808, 36, 18);
      row.add(g);
      row.add(txt(this, -360, 0, '#' + (r + 1), 48));
      row.add(this.add.image(-270, 0, 'char_' + s.p).setDisplaySize(80, 80));
      row.add(txt(this, -210, 0, PNAME[s.p] + (s.cpu ? ' (CPU)' : ''), 44, '#ffffff', { ox: 0 }));
      const unit = mode === 'wins' ? '★' : (d.label || '');
      const sc = txt(this, 370, 0, '0' + (unit ? ' ' + unit : ''), 54, '#ffffff', { ox: 1 });
      row.add(sc);
      const target = scores[i];
      this.tweens.addCounter({ from: 0, to: target, duration: 600, delay: 700 + r * 150, onUpdate: tw => sc.setText(Math.round(tw.getValue()) + (unit ? ' ' + unit : '')) });
      row.x = W + 500;
      this.tweens.add({ targets: row, x: W / 2, duration: 420, delay: 400 + r * 120, ease: 'Back.easeOut', onStart: () => audio.play('whoosh', { volume: 0.5 }) });
    });

    // buttons
    const yb = Math.max(by + slots.length * 128 + 120, H - 330);
    if (tour) {
      const last = tour.idx + 1 >= tour.games.length;
      const b = button(this, W / 2, yb + 30, 760, 160, last ? 'LIHAT JUARA' : 'LANJUT', { color: C.green, icon: 'ic_next', onClick: () => { tour.idx++; tour.counted = false; fadeTo(this, 'Tour'); } });
      popIn(this, b, 1100);
    } else {
      const b1 = button(this, W / 2, yb, 760, 150, 'MAIN LAGI', { color: C.green, icon: 'ic_retry', onClick: () => launchGame(this, meta) });
      const b2 = button(this, W / 2 - 195, yb + 190, 370, 130, 'GAME LAIN', { color: C.accent, size: 44, onClick: () => fadeTo(this, 'Select') });
      const b3 = button(this, W / 2 + 195, yb + 190, 370, 130, 'MENU', { color: C.panel, size: 44, icon: 'ic_home', onClick: () => fadeTo(this, 'Title') });
      [b1, b2, b3].forEach((b, k) => popIn(this, b, 1100 + k * 100));
    }
    const off = native.onBack(() => { fadeTo(this, tour ? 'Title' : 'Select'); return true; });
    this.events.once('shutdown', off);
  }
}
