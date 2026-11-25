import Phaser from 'phaser';
import { C, txt } from '../theme.js';
import { audio } from '../lib/audio.js';
import { makeTextures } from '../ui.js';
import { GAMES } from '../games/index.js';

const SFX = ['tap', 'back', 'whoosh', 'select', 'countdown', 'go', 'point', 'gem', 'hit', 'punch', 'boom', 'smallboom', 'win', 'lose', 'jump', 'dash', 'shoot', 'laser', 'bounce', 'correct', 'wrong', 'pop', 'thud', 'star', 'levelup', 'splash', 'tick', 'break', 'flip', 'charge', 'slide'];
const MUSIC = ['music_menu', 'music_game', 'music_game2', 'music_win'];

export default class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const { width: W, height: H } = this.scale;
    this.add.rectangle(W / 2, H / 2, W, H, C.bg);
    txt(this, W / 2, H / 2 - 120, 'PESTA 1234', 110, '#ffd23f');
    const barW = 640;
    this.add.rectangle(W / 2, H / 2 + 40, barW + 16, 56, C.outline).setOrigin(0.5);
    const bar = this.add.rectangle(W / 2 - barW / 2, H / 2 + 40, 4, 40, C.accent).setOrigin(0, 0.5);
    this.load.on('progress', p => { bar.width = Math.max(4, barW * p); });
    const S = (k, w, h) => this.load.svg(k, `art/${k}.svg`, { width: w, height: h ?? w });
    for (let i = 0; i < 4; i++) {
      S('char_' + i, 160); S('charO_' + i, 160); S('tank_' + i, 140); S('car_' + i, 150, 94);
      S('ship_' + i, 140); S('bird_' + i, 140, 120); S('mallet_' + i, 180);
    }
    ['ball', 'coin', 'star', 'puck'].forEach(k => S(k, 96));
    S('bomb', 110, 126); S('crown', 240, 180); S('trophy', 240, 255); S('knife', 50, 175); S('log', 420);
    S('target', 200); S('mole', 200); S('meteor', 200); S('cpu', 120); S('logo', 900, 420);
    S('rps_0', 200); S('rps_1', 200); S('rps_2', 200);
    ['pause', 'home', 'retry', 'gear', 'music', 'sound', 'vibrate', 'back', 'play', 'trophy', 'info', 'next'].forEach(k => S('ic_' + k, 96));
    GAMES.forEach(g => S(g.icon, 240));
    S('gi_random', 240);
  }
  async create() {
    makeTextures(this);
    const map = {};
    SFX.forEach(k => { map[k] = `audio/${k}.wav`; });
    MUSIC.forEach(k => { map[k] = `audio/${k}.ogg`; });
    try { await audio.load(map); } catch (e) { console.warn('audio', e); }
    this.scene.start('Title');
  }
}
