import Phaser from 'phaser';
import { C, txt, body } from '../theme.js';
import { button, iconButton, panel, backdrop, toggle } from '../ui.js';
import { audio } from '../lib/audio.js';
import { haptics } from '../lib/haptics.js';
import { native } from '../lib/native.js';
import { storage } from '../lib/storage.js';

export class Pause extends Phaser.Scene {
  constructor() { super('Pause'); }
  create(data) {
    const { width: W, height: H } = this.scale;
    this.from = data.from;
    backdrop(this);
    const p = panel(this, W / 2, H / 2, 820, 940, { title: 'JEDA', titleColor: C.cyan });
    const y = H / 2 - 260;
    const b1 = button(this, W / 2, y, 640, 140, 'LANJUT', { color: C.green, icon: 'ic_play', onClick: () => this.resume() });
    const b2 = button(this, W / 2, y + 190, 640, 140, 'ULANG', { color: C.accent, icon: 'ic_retry', onClick: () => this.restart() });
    const b3 = button(this, W / 2, y + 380, 640, 140, 'KELUAR', { color: 0xe5484d, icon: 'ic_home', onClick: () => this.quit() });
    // quick audio toggles
    const st = audio.settings;
    const mk = (x, icon, get, set) => {
      const b = iconButton(this, x, y + 580, 60, icon, { color: get() ? C.panel : 0x4a4460, onClick: () => { set(!get()); this.scene.restart({ from: this.from }); } });
      if (!get()) b.add(this.add.graphics().lineStyle(10, 0xff4d5e).lineBetween(-36, -36, 36, 36));
      return b;
    };
    mk(W / 2 - 180, 'ic_music', () => audio.settings.music > 0, v => audio.set({ music: v ? 0.6 : 0 }));
    mk(W / 2, 'ic_sound', () => audio.settings.sfx > 0, v => audio.set({ sfx: v ? 1 : 0 }));
    mk(W / 2 + 180, 'ic_vibrate', () => haptics.isEnabled(), v => haptics.setEnabled(v));
    [p, b1, b2, b3].forEach((o, k) => { o.setScale(0.8); o.alpha = 0; this.tweens.add({ targets: o, scale: 1, alpha: 1, duration: 300, delay: k * 40, ease: 'Back.easeOut' }); });
    const off = native.onBack(() => { this.resume(); return true; });
    this.events.once('shutdown', off);
  }
  resume() { audio.duckMusic(false); this.scene.resume(this.from); this.scene.stop(); }
  restart() {
    const g = this.scene.get(this.from);
    const d = g.d;
    this.scene.stop();
    g.scene.restart({ ...d, wins: undefined, round: 1 });
  }
  quit() {
    const g = this.scene.get(this.from);
    const tour = g.d && g.d.tour;
    this.scene.stop(this.from);
    this.scene.stop();
    this.scene.start(tour ? 'Title' : 'Select');
  }
}

export class Settings extends Phaser.Scene {
  constructor() { super('Settings'); }
  create(data) {
    const { width: W, height: H } = this.scale;
    this.from = data.from;
    backdrop(this);
    const p = panel(this, W / 2, H / 2, 880, 980, { title: 'PENGATURAN', titleColor: C.accent });
    const y = H / 2 - 270;
    const rows = [
      toggle(this, W / 2, y, 'Musik', 'ic_music', audio.settings.music > 0, v => audio.set({ music: v ? 0.6 : 0 })),
      toggle(this, W / 2, y + 160, 'Efek suara', 'ic_sound', audio.settings.sfx > 0, v => audio.set({ sfx: v ? 1 : 0 })),
      toggle(this, W / 2, y + 320, 'Getar', 'ic_vibrate', haptics.isEnabled(), v => { haptics.setEnabled(v); if (v) haptics.medium(); })
    ];
    const reset = button(this, W / 2, y + 490, 620, 110, 'Hapus statistik', { color: C.grey, size: 42, onClick: () => {
      storage.set('stats', { matches: 0, plays: {}, winsBy: [0, 0, 0, 0] }); reset.setLabel('Statistik dihapus ✓'); audio.play('correct');
    } });
    const close = button(this, W / 2, y + 660, 560, 140, 'TUTUP', { color: C.green, onClick: () => this.close() });
    body(this, W / 2, H / 2 + 450, 'Pesta 1234 Pemain • v1.0', 28, '#a99bd6');
    [p, ...rows, reset, close].forEach((o, k) => { o.setScale(0.85); o.alpha = 0; this.tweens.add({ targets: o, scale: 1, alpha: 1, duration: 300, delay: k * 40, ease: 'Back.easeOut' }); });
    const off = native.onBack(() => { this.close(); return true; });
    this.events.once('shutdown', off);
  }
  close() { audio.play('back'); this.scene.resume(this.from); this.scene.stop(); }
}
