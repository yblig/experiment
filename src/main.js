import '@fontsource/outfit/400.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/800.css';
import './style.css';
import { storage } from './lib/storage.js';
import { audio } from './lib/audio.js';
import { native } from './lib/native.js';
import { haptics } from './lib/haptics.js';
import { settings, CHORD_SETS, chordSet, SCALES, ROOTS } from './settings.js';
import { applyMix, stopBeat } from './sound.js';
import { icon, handSVG, MODE_ART, HERO_ART } from './art.js';
import { ui, el, sfx, sheet, toast } from './ui.js';
import { openPlay, MODES, playTake } from './play.js';

const app = document.getElementById('app');
const FI = [[0, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 1, 1, 0, 0], [0, 1, 1, 1, 0], [0, 1, 1, 1, 1], [1, 1, 1, 1, 1]];
const DESC = {
  guitar: 'Hand shape = chord, other hand strums',
  piano: 'Pinch your fingers to play notes',
  drums: 'Flick fingers onto 6 drum pads',
  theremin: 'Wave your hand to bend the pitch',
  challenge: 'Show the chord before time runs out'
};

function home() {
  app.querySelector('.home')?.remove();
  const best = storage.get('bestChallenge', 0);
  const h = el(`<div class="screen home in">
    <div class="spot s1"></div><div class="spot s2"></div>
    <header><div class="logo">Air<b>Strum</b></div><button class="ib" data-h="help" aria-label="How to play">${icon('help')}</button></header>
    <div class="hero">${HERO_ART}<p>Play music with your hands. No guitar needed.</p></div>
    <div class="modes">
      ${['guitar', 'piano', 'drums', 'theremin'].map(k => `<button class="mode" data-p="${k}" style="--c:${MODES[k].color}"><i>${MODE_ART[k]}</i><b>${MODES[k].name}</b><small>${DESC[k]}</small></button>`).join('')}
      <button class="mode wide" data-p="challenge" style="--c:${MODES.challenge.color}"><i>${MODE_ART.challenge}</i><span><b>Chord Challenge</b><small>${DESC.challenge}</small></span><em>${best ? `Best ${best}` : 'New'}</em></button>
    </div>
    <nav><button data-h="help">${icon('help')}<span>How to</span></button><button data-h="takes">${icon('takes')}<span>Takes</span></button><button data-h="settings">${icon('gear')}<span>Settings</span></button></nav>
  </div>`);
  app.appendChild(h);
  h.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; haptics.tap();
    if (b.dataset.p) { sfx('ui_confirm'); openPlay(b.dataset.p); }
    else if (b.dataset.h === 'help') howTo();
    else if (b.dataset.h === 'takes') takes();
    else if (b.dataset.h === 'settings') settingsSheet();
  });
}
ui.onPlayClosed = () => { stopBeat(); home(); };

function howTo(start = 'guitar') {
  sfx('ui_open');
  const chords = chordSet();
  const page = k => ({
    guitar: `<p class="lead">Hold your <b>left hand</b> up and show fingers to pick a chord. Swipe your <b>right hand</b> down or up across the dashed line to strum. Faster swipe = louder.</p>
      <div class="poses">${chords.map((c, i) => `<div class="pose">${handSVG(FI[i], { size: 64 })}<b>${c.name}</b><small>${i === 0 ? 'fist' : i + (i === 1 ? ' finger' : ' fingers')}</small></div>`).join('')}</div>
      <p class="note">Only one hand in view? It picks the chord and strums at the same time.</p>`,
    piano: `<p class="lead">Touch your <b>thumb</b> to a fingertip to play a note. 8 notes, one per finger.</p>
      <div class="poses two">${[1, 2, 3, 4].map(f => `<div class="pose">${handSVG([1, 1, 1, 1, 1], { size: 64, pinch: f, glow: '#3ef0d0' })}<b>${['Index', 'Middle', 'Ring', 'Pinky'][f - 1]}</b><small>L${f} / R${f}</small></div>`).join('')}</div>
      <p class="note">Left hand plays the low 4 notes (pinky lowest), right hand the high 4. Change key, scale and octave under the keys.</p>`,
    drums: `<p class="lead">Point your <b>index finger</b> and flick it down onto a drum pad, like hitting with a stick. Both hands work.</p>
      <div class="poses two">${['Hi-hat', 'Crash', 'Snare', 'Tom', 'Floor', 'Kick'].map((n, i) => `<div class="pose pad" style="--c:${['#ffc94a', '#ff4f9a', '#fff5ea', '#3ef0d0', '#b57cff', '#ff6a3d'][i]}"><span></span><b>${n}</b></div>`).join('')}</div>`,
    theremin: `<p class="lead">Move your <b>right hand</b> up and down to change the pitch. Your <b>left hand</b> height sets the volume. Make a <b>fist</b> to go silent.</p>
      <div class="poses two"><div class="pose">${handSVG([1, 1, 1, 1, 1], { size: 64, glow: '#b57cff' })}<b>Open</b><small>sound on</small></div><div class="pose">${handSVG([0, 0, 0, 0, 0], { size: 64 })}<b>Fist</b><small>silence</small></div></div>`,
    challenge: `<p class="lead">A chord pops up. Make its hand shape and strum. Every hit scores, streaks multiply up to x5. You have 45 seconds.</p>`,
    tips: `<ul class="tips"><li>Good light in front of you helps tracking a lot.</li><li>Prop the phone up and stand about an arm's length away.</li><li>Lefty? Swap hands in Settings.</li><li>Tap the record button to save a take, then loop it and jam over it.</li><li>The beat button adds a drum groove at your tempo.</li></ul>`
  })[k];
  const tabs = ['guitar', 'piano', 'drums', 'theremin', 'challenge', 'tips'];
  const render = k => `<h2>How to play</h2><div class="chips tabs">${tabs.map(t => `<button class="chip ${t === k ? 'on' : ''}" data-s="t:${t}">${t === 'tips' ? 'Tips' : MODES[t].name.replace('Air ', '')}</button>`).join('')}</div><div class="howpage">${page(k)}</div>`;
  sheet.open(render(start), (s, body) => { if (s.startsWith('t:')) { sfx('ui_tap'); body.innerHTML = render(s.slice(2)); } return false; });
  storage.set('seenHow', true);
}

function takes() {
  sfx('ui_open');
  let playing = null, playingId = null;
  const fmt = ms => `${Math.floor(ms / 60000)}:${String(Math.round(ms / 1000) % 60).padStart(2, '0')}`;
  const render = () => {
    const list = storage.get('takes', []);
    return `<h2>Your takes</h2>${list.length ? `<div class="takes">${list.map(t => `<div class="take" style="--c:${MODES[t.mode]?.color}"><i>${MODE_ART[t.mode] || ''}</i><span><b>${t.name}</b><small>${fmt(t.dur)} · ${new Date(t.date).toLocaleDateString()}</small></span>
      <button class="ib ${playingId === t.id ? 'on' : ''}" data-s="p:${t.id}">${icon(playingId === t.id ? 'stop' : 'play')}</button><button class="ib" data-s="d:${t.id}">${icon('trash')}</button></div>`).join('')}</div>`
      : `<div class="empty">${MODE_ART.guitar}<p>No takes yet. Tap the red record button while you play to save one.</p></div>`}`;
  };
  sheet.open(render(), (s, body) => {
    const id = +s.slice(2), list = storage.get('takes', []);
    if (s.startsWith('p:')) {
      haptics.tap(); playing?.stop();
      if (playingId === id) { playingId = null; playing = null; }
      else { const t = list.find(x => x.id === id); playingId = id; playing = playTake(t, false, () => { playingId = null; playing = null; body.innerHTML = render(); }); }
    } else if (s.startsWith('d:')) {
      if (playingId === id) { playing?.stop(); playingId = null; }
      storage.set('takes', list.filter(x => x.id !== id)); sfx('ui_back'); toast('Take deleted');
    }
    body.innerHTML = render(); return false;
  }, { dismiss: () => playing?.stop() });
}

function settingsSheet() {
  sfx('ui_open');
  const sl = (k, label, min = 0, max = 1, step = 0.05) => `<label class="slider"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${settings.get(k)}" data-in="${k}"></label>`;
  const tg = (k, label) => `<button class="toggle ${settings.get(k) ? 'on' : ''}" data-s="tg:${k}"><span>${label}</span><i></i></button>`;
  const ch = (k, opts) => `<div class="chips">${opts.map(([v, n]) => `<button class="chip ${settings.get(k) === v ? 'on' : ''}" data-s="ch:${k}:${v}">${n}</button>`).join('')}</div>`;
  const render = () => `<h2>Settings</h2>
    <h4>Sound</h4>${sl('instVol', 'Instrument volume')}${sl('uiVol', 'Button sounds')}${sl('reverb', 'Reverb')}${sl('beatVol', 'Backing beat')}
    <h4>Guitar tone</h4>${ch('tone', [['acoustic', 'Acoustic'], ['nylon', 'Nylon'], ['electric', 'Electric'], ['drive', 'Overdrive']])}
    <h4>Chord set</h4>${ch('chordSet', Object.entries(CHORD_SETS).map(([k, v]) => [k, v.name]))}
    <h4>Piano and theremin key</h4>${ch('root', ROOTS.map((r, i) => [i, r]))}${ch('scale', Object.entries(SCALES).map(([k, v]) => [k, v.name]))}
    <h4>Camera and hands</h4>${ch('sens', [['low', 'Calm'], ['mid', 'Normal'], ['high', 'Sensitive']])}${ch('facing', [['user', 'Front camera'], ['environment', 'Back camera']])}
    ${tg('lefty', 'Lefty mode (swap hands)')}${tg('skeleton', 'Show hand skeleton')}${sl('dim', 'Darken camera')}
    <h4>Other</h4>${tg('haptics', 'Vibration')}
    <button class="btn ghost" data-s="cam">Ask camera / touch choice again</button>
    <p class="ver">Air Strum · hand tracking runs fully on your phone</p>`;
  sheet.open(render(), (s, body, elm) => {
    if (s.startsWith('in:')) { const k = s.slice(3); settings.set(k, +elm.value); applyMix(); if (k === 'dim') document.querySelector('.play .dim')?.style.setProperty('opacity', elm.value); return false; }
    haptics.tap();
    if (s.startsWith('tg:')) { const k = s.slice(3); settings.set(k, !settings.get(k)); if (k === 'haptics') haptics.setEnabled(settings.get(k)); sfx('ui_toggle'); }
    else if (s.startsWith('ch:')) { const [, k, v] = s.split(':'); settings.set(k, k === 'root' ? +v : v); sfx('ui_tap'); }
    else if (s === 'cam') { storage.set('camChoice', null); toast('You will be asked next time you play'); sfx('ui_tap'); }
    const y = body.parentElement.scrollTop; body.innerHTML = render(); body.parentElement.scrollTop = y;
    return false;
  });
}

(async function boot() {
  await storage.init();
  await native.init();
  native.onBack(() => sheet.close());
  applyMix();
  haptics.setEnabled(settings.get('haptics'));
  const A = ['ui_tap', 'ui_toggle', 'ui_open', 'ui_back', 'ui_confirm', 'correct', 'wrong', 'levelup', 'star', 'countdown', 'go', 'rec'];
  await audio.load(Object.fromEntries(A.map(k => [k, `audio/${k}.wav`])));
  home();
  native.hideSplash();
  if (!storage.get('seenHow')) setTimeout(() => howTo(), 700);
})();
