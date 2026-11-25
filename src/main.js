import Phaser from 'phaser';
import '@fontsource/lilita-one/400.css';
import '@fontsource/fredoka/600.css';
import { storage } from './lib/storage.js';
import { native } from './lib/native.js';
import Boot from './scenes/Boot.js';
import Title from './scenes/Title.js';
import Select from './scenes/Select.js';
import Results from './scenes/Results.js';
import { Pause, Settings } from './scenes/Overlays.js';
import { Tour, TourSetup } from './scenes/Tour.js';
import { GAMES } from './games/index.js';
import { txt } from './theme.js';

async function start() {
  await storage.init();
  await native.init();
  try { await Promise.all([document.fonts.load('400 64px "Lilita One"'), document.fonts.load('600 40px Fredoka')]); } catch { /* ignore */ }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'app',
    backgroundColor: '#1a1033',
    scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1080, height: 1920 },
    input: { activePointers: 6 },
    render: { antialias: true, roundPixels: false, powerPreference: 'high-performance' },
    fps: { target: 60 },
    scene: [Boot, Title, Select, Results, TourSetup, Tour, ...GAMES.map(g => g.cls), Pause, Settings]
  });
  window.__game = game;
  native.onPause(() => window.__activeGame?.openPause());
  native.toast = (msg) => {
    const sc = game.scene.getScenes(true).slice(-1)[0];
    if (!sc) return;
    const { width: W, height: H } = sc.scale;
    const t = txt(sc, W / 2, H - 220, 'Tekan sekali lagi untuk keluar', 40).setDepth(999);
    sc.tweens.add({ targets: t, alpha: 0, delay: 1400, duration: 400, onComplete: () => t.destroy() });
  };
}
start();

// debug hook for automated previews
import { byId } from './games/index.js';
import { slotsFor, session } from './session.js';
window.__launch = (id, humans = 2) => {
  session.humans = humans;
  const g = window.__game;
  const cur = g.scene.getScenes(true);
  cur.forEach(s => s.scene.stop());
  const meta = byId[id];
  g.scene.start(id, { meta, slots: slotsFor(meta, humans), tour: null });
};
