// The play screen: camera + canvas overlay + one of five modes.
import { Tracker, loadModel, fakeHand } from './hands.js';
import * as snd from './sound.js';
import { settings, sens, chordSet, pianoNotes, SCALES, ROOTS, CHORD_SETS } from './settings.js';
import { storage } from './lib/storage.js';
import { audio } from './lib/audio.js';
import { haptics } from './lib/haptics.js';
import { native } from './lib/native.js';
import { icon, handSVG, MODE_ART } from './art.js';
import { ui, sfx, el, sheet, toast } from './ui.js';

export const MODES = {
  guitar: { name: 'Air Guitar', color: '#ff6a3d' },
  piano: { name: 'Air Piano', color: '#3ef0d0' },
  drums: { name: 'Air Drums', color: '#ffc94a' },
  theremin: { name: 'Theremin', color: '#b57cff' },
  challenge: { name: 'Chord Challenge', color: '#ff4f9a' }
};
const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
const FINGER_ICON = n => [[0, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 1, 1, 0, 0], [0, 1, 1, 1, 0], [0, 1, 1, 1, 1], [1, 1, 1, 1, 1]][n];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let S = null; // current play session

export function openPlay(mode) {
  const root = el(`<div class="screen play" data-mode="${mode}">
    <video class="cam" playsinline muted></video>
    <div class="dim"></div>
    <canvas class="fx"></canvas>
    <div class="topbar">
      <button class="ib" data-a="back" aria-label="Back">${icon('back')}</button>
      <div class="mtitle"><b></b><span class="status"></span></div>
      <button class="ib" data-a="beat" aria-label="Backing beat">${icon('beat')}</button>
      <button class="ib rec" data-a="rec" aria-label="Record">${icon('rec')}</button>
      <button class="ib loopb hidden" data-a="loop" aria-label="Loop">${icon('loop')}</button>
      <button class="ib" data-a="cam" aria-label="Camera">${icon('cam')}</button>
    </div>
    <div class="modetabs">${Object.entries(MODES).map(([k, m]) => `<button data-m="${k}" style="--c:${m.color}">${MODE_ART[k]}</button>`).join('')}</div>
    <div class="bigread"></div>
    <div class="history"></div>
    <div class="bottom"></div>
    <div class="handhint hidden">${handSVG([1, 1, 1, 1, 1], { size: 70, glow: '#fff' })}<span>Show your hands to the camera</span></div>
  </div>`);
  document.getElementById('app').appendChild(root);
  const video = root.querySelector('video'), canvas = root.querySelector('canvas');
  S = {
    root, video, canvas, g: canvas.getContext('2d'), mode: null, tracker: new Tracker(video), hands: [], W: 0, H: 0,
    particles: [], pointers: new Map(), raf: 0, last: performance.now(), cam: 'off', rec: null, loop: null, take: null,
    beatFlash: 0, history: [], unBack: null, unBeat: null, fake: null
  };
  window.__app = S;
  const resize = () => { const r = devicePixelRatio || 1; S.W = innerWidth; S.H = innerHeight; canvas.width = S.W * r; canvas.height = S.H * r; S.g.setTransform(r, 0, 0, r, 0, 0); };
  resize(); S.onResize = resize; addEventListener('resize', resize);
  root.querySelector('.dim').style.opacity = settings.get('dim');
  root.addEventListener('click', onClick);
  canvas.addEventListener('pointerdown', onPointer); canvas.addEventListener('pointermove', onPointer);
  canvas.addEventListener('pointerup', onPointer); canvas.addEventListener('pointercancel', onPointer);
  S.unBack = native.onBack(() => { if (sheet.close()) return true; closePlay(); return true; });
  S.unBeat = snd.onBeat(b => { S.beatFlash = b === 0 ? 1 : 0.6; });
  setMode(mode);
  requestAnimationFrame(() => root.classList.add('in'));
  S.raf = requestAnimationFrame(loop);
  if (storage.get('camChoice') === 'touch') setStatus('Touch mode'), setCam('off');
  else if (storage.get('camChoice') === 'cam') startCamera();
  else askCamera();
}

export function closePlay() {
  if (!S) return;
  const s = S; S = null;
  cancelAnimationFrame(s.raf); s.tracker.stop(); snd.thereminOff(true); snd.setRecorder(null); stopLoop(s);
  s.unBack?.(); s.unBeat?.(); removeEventListener('resize', s.onResize);
  if (s.mode?.exit) s.mode.exit();
  sfx('ui_back'); haptics.tap();
  s.root.classList.remove('in'); setTimeout(() => s.root.remove(), 260);
  ui.onPlayClosed?.();
}

function setStatus(t) { if (S) S.root.querySelector('.status').textContent = t; }
function setCam(state) { S.cam = state; S.root.classList.toggle('nocam', state !== 'live'); }

function askCamera() {
  sheet.open(`<div class="perm">
    <div class="perm-art">${handSVG([0, 1, 1, 0, 0], { size: 120, glow: '#ff6a3d' })}</div>
    <h2>Play with your hands</h2>
    <p>Air Strum watches your hands through the camera to play notes. The video stays on your phone, nothing is uploaded.</p>
    <button class="btn primary" data-s="cam">${icon('cam')} Turn on camera</button>
    <button class="btn ghost" data-s="touch">${icon('touch')} Use touch only</button>
  </div>`, b => {
    if (b === 'cam') { storage.set('camChoice', 'cam'); startCamera(); }
    if (b === 'touch') { storage.set('camChoice', 'touch'); setStatus('Touch mode'); setCam('off'); toast('Tap and swipe the screen to play'); }
    return true;
  }, { dismiss: () => { setStatus('Touch mode'); setCam('off'); } });
}

async function startCamera() {
  if (!S) return;
  setCam('loading'); setStatus('Starting camera…');
  try {
    await S.tracker.start(settings.get('facing'));
    setStatus('Loading hand tracking…');
    await loadModel(setStatus);
    if (!S) return;
    setCam('live'); setStatus('Hands: 0'); sfx('ui_confirm');
  } catch (e) {
    console.warn(e);
    if (!S) return;
    setCam('off'); setStatus('Touch mode');
    toast(e && e.name === 'NotAllowedError' ? 'Camera blocked. Allow it in phone settings, or play by touch.' : 'Camera not available, playing by touch');
  }
}

// ---------- top bar ----------
function onClick(e) {
  const b = e.target.closest('button'); if (!b || !S) return;
  if (b.dataset.m) { if (b.dataset.m !== S.mode.id) { sfx('ui_open'); setMode(b.dataset.m); } return; }
  const a = b.dataset.a;
  if (a) haptics.tap();
  if (a === 'back') closePlay();
  else if (a === 'beat') openBeatSheet();
  else if (a === 'rec') toggleRec();
  else if (a === 'loop') toggleLoop();
  else if (a === 'cam') {
    sfx('ui_tap');
    if (S.cam === 'live') { settings.set('facing', settings.get('facing') === 'user' ? 'environment' : 'user'); startCamera(); toast(settings.get('facing') === 'user' ? 'Front camera' : 'Back camera'); }
    else { storage.set('camChoice', 'cam'); startCamera(); }
  } else if (S.mode.click) S.mode.click(b, e);
}

function openBeatSheet() {
  sfx('ui_open');
  const render = () => `<h3>Backing beat</h3>
    <div class="chips">${Object.entries(snd.GROOVES).map(([k, g]) => `<button class="chip ${settings.get('groove') === k ? 'on' : ''}" data-s="g:${k}">${g.name}</button>`).join('')}</div>
    <div class="row stepper"><span>Tempo</span><button class="ib" data-s="bpm:-4">${icon('minus')}</button><b class="bpm">${settings.get('bpm')} BPM</b><button class="ib" data-s="bpm:4">${icon('plus')}</button></div>
    <button class="btn ${snd.beatOn() ? 'ghost' : 'primary'}" data-s="toggle">${snd.beatOn() ? icon('stop') + ' Stop beat' : icon('play') + ' Start beat'}</button>`;
  sheet.open(render(), (k, body) => {
    sfx('ui_tap'); haptics.tap();
    if (k.startsWith('g:')) settings.set('groove', k.slice(2));
    else if (k.startsWith('bpm:')) settings.set('bpm', clamp(settings.get('bpm') + +k.slice(4), 60, 180));
    else if (k === 'toggle') { snd.beatOn() ? snd.stopBeat() : snd.startBeat(); S.root.querySelector('[data-a=beat]').classList.toggle('on', snd.beatOn()); }
    body.innerHTML = render();
    return false;
  });
}

// ---------- looper ----------
function toggleRec() {
  const b = S.root.querySelector('[data-a=rec]');
  if (!S.rec) {
    stopLoop(S);
    S.rec = { t0: performance.now(), ev: [], mode: S.mode.id, lastThr: 0 };
    snd.setRecorder((k, a) => {
      if (!S?.rec) return; const t = performance.now() - S.rec.t0;
      if (k === 'thr') { if (t - S.rec.lastThr < 33) return; S.rec.lastThr = t; }
      if (S.rec.ev.length < 8000) S.rec.ev.push([Math.round(t), k, a]);
    });
    b.classList.add('on'); b.innerHTML = icon('stop'); sfx('rec'); toast('Recording… tap stop when done');
  } else {
    const r = S.rec; S.rec = null; snd.setRecorder(null); snd.thereminOff(true);
    b.classList.remove('on'); b.innerHTML = icon('rec');
    const dur = performance.now() - r.t0;
    if (!r.ev.length) { toast('Nothing recorded'); return; }
    if (r.ev[r.ev.length - 1][1] === 'thr') r.ev.push([Math.round(dur), 'thrOff', []]);
    const takes = storage.get('takes', []);
    const n = (storage.get('takeCount', 0) || 0) + 1; storage.set('takeCount', n);
    const take = { id: Date.now(), name: `${MODES[r.mode].name} #${n}`, mode: r.mode, dur: Math.round(dur), date: Date.now(), ev: r.ev };
    takes.unshift(take); storage.set('takes', takes.slice(0, 12));
    S.take = take; sfx('ui_confirm'); haptics.success();
    S.root.querySelector('.loopb').classList.remove('hidden');
    toast('Saved! Tap the loop button to jam over it');
  }
}
function toggleLoop() {
  if (S.loop) { stopLoop(S); sfx('ui_tap'); return; }
  if (S.take) { S.loop = playTake(S.take, true); S.root.querySelector('.loopb').classList.add('on'); sfx('ui_tap'); }
}
function stopLoop(s) { s.loop?.stop(); s.loop = null; s.root.querySelector('.loopb')?.classList.remove('on'); }
export function playTake(take, loop = false, onEnd) {
  let timers = [], stopped = false;
  const run = () => {
    take.ev.forEach(([t, k, a]) => timers.push(setTimeout(() => !stopped && snd.replay(k, a), t)));
    timers.push(setTimeout(() => { if (stopped) return; snd.thereminOff(true); if (loop) { timers = []; run(); } else onEnd?.(); }, take.dur + 40));
  };
  run();
  return { stop() { stopped = true; timers.forEach(clearTimeout); snd.thereminOff(true); } };
}

// ---------- particles ----------
function burst(x, y, color, n = 14, text = '') {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 220; S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 1, color, r: 2 + Math.random() * 4 }); }
  if (text) S.particles.push({ x, y: y - 20, vx: 0, vy: -70, life: 1.3, color, text });
}
function pushHistory(label, color) {
  S.history.unshift({ label, color }); S.history = S.history.slice(0, 8);
  S.root.querySelector('.history').innerHTML = S.history.map((h, i) => `<span style="--c:${h.color};opacity:${1 - i * 0.11}">${h.label}</span>`).join('');
}
function bigRead(html, color) { const b = S.root.querySelector('.bigread'); b.innerHTML = html; b.style.setProperty('--c', color); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }

// ---------- main loop ----------
function loop(now) {
  if (!S) return;
  const dt = Math.min(0.05, (now - S.last) / 1000); S.last = now;
  let hands = S.fake ? S.fake(now) : (S.cam === 'live' ? S.tracker.detect(S.W, S.H) : []);
  hands = [...hands].sort((a, b) => a.cx - b.cx);
  if (settings.get('lefty')) hands.reverse();
  S.hands = hands;
  if (S.cam === 'live') setStatus(`Hands: ${hands.length}`);
  S.root.querySelector('.handhint').classList.toggle('hidden', !(S.cam === 'live' && !hands.length && !S.fake));
  S.mode.update(hands, dt, now);
  draw(dt, now);
  S.raf = requestAnimationFrame(loop);
}

function draw(dt, now) {
  const { g, W, H } = S; g.clearRect(0, 0, W, H);
  if (S.beatFlash > 0) { g.fillStyle = `rgba(255,201,74,${S.beatFlash * 0.08})`; g.fillRect(0, 0, W, H); S.beatFlash -= dt * 4; }
  S.mode.draw(g, W, H, now);
  if (settings.get('skeleton')) S.hands.forEach(h => drawHand(g, h, S.mode.color));
  // particles
  g.save();
  S.particles = S.particles.filter(p => (p.life -= dt * (p.text ? 0.9 : 1.6)) > 0);
  for (const p of S.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt; if (!p.text) p.vy += 300 * dt;
    g.globalAlpha = clamp(p.life, 0, 1);
    if (p.text) { g.font = '800 26px Outfit, sans-serif'; g.textAlign = 'center'; g.fillStyle = p.color; g.shadowColor = p.color; g.shadowBlur = 16; g.fillText(p.text, p.x, p.y); g.shadowBlur = 0; }
    else { g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, p.r * p.life + 0.5, 0, 7); g.fill(); }
  }
  g.restore();
}

function drawHand(g, h, color) {
  const P = h.pts; g.save(); g.lineCap = 'round';
  g.strokeStyle = color; g.globalAlpha = 0.35; g.lineWidth = 12; g.beginPath();
  BONES.forEach(([a, b]) => { g.moveTo(P[a].x, P[a].y); g.lineTo(P[b].x, P[b].y); }); g.stroke();
  g.globalAlpha = 0.95; g.lineWidth = 3.5; g.strokeStyle = '#fff5ea'; g.stroke();
  P.forEach((p, i) => { const tip = [4, 8, 12, 16, 20].includes(i); g.fillStyle = tip ? color : '#fff5ea'; g.beginPath(); g.arc(p.x, p.y, tip ? 7 : 4, 0, 7); g.fill(); });
  // finger counter badge
  g.globalAlpha = 1; const bx = P[0].x, by = P[0].y + 34;
  g.fillStyle = 'rgba(14,10,31,.75)'; g.beginPath(); g.arc(bx, by, 17, 0, 7); g.fill();
  g.strokeStyle = color; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#fff5ea'; g.font = '800 18px Outfit, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(h.count, bx, by + 1);
  g.restore();
}

// ---------- modes ----------
function setMode(id) {
  S.mode?.exit?.();
  snd.thereminOff(true);
  S.root.dataset.mode = id;
  const m = MODES[id];
  S.root.querySelector('.mtitle b').textContent = m.name;
  S.root.querySelectorAll('.modetabs button').forEach(b => b.classList.toggle('on', b.dataset.m === id));
  S.root.querySelector('.bigread').innerHTML = ''; S.history = []; S.root.querySelector('.history').innerHTML = '';
  S.mode = { ...MODE_IMPL[id](), id, color: m.color, name: m.name };
  S.mode.enter?.();
}

// pointer → touch play
function onPointer(e) {
  if (!S) return;
  const p = { x: e.clientX, y: e.clientY, t: performance.now() };
  if (e.type === 'pointerdown') { S.pointers.set(e.pointerId, { ...p, py: p.y, pt: p.t }); S.mode.touch?.('down', p, S.pointers.get(e.pointerId)); }
  else if (e.type === 'pointermove') { const q = S.pointers.get(e.pointerId); if (!q) return; S.mode.touch?.('move', p, q); q.py = p.y; q.pt = p.t; q.x = p.x; q.y = p.y; }
  else { const q = S.pointers.get(e.pointerId); S.pointers.delete(e.pointerId); S.mode.touch?.('up', p, q); }
}

const MODE_IMPL = {
  guitar: () => guitarMode(false),
  challenge: () => guitarMode(true),
  piano: pianoMode,
  drums: drumsMode,
  theremin: thereminMode
};

function guitarMode(challenge) {
  let chords = chordSet(), cur = 1, cand = -1, candN = 0, prevY = null, prevN = 0, lastStrum = 0, strings = 0, sdir = 1;
  const color = challenge ? MODES.challenge.color : MODES.guitar.color;
  const ch = { phase: 'idle', t: 0, score: 0, combo: 0, target: 1, best: storage.get('bestChallenge', 0), endsAt: 0 };
  const bottom = S.root.querySelector('.bottom');
  const renderChips = () => {
    bottom.innerHTML = `<div class="chordchips">${chords.map((c, i) => `<button class="cc ${i === cur ? 'on' : ''}" data-c="${i}"><span class="hand">${handSVG(FINGER_ICON(i), { size: 40 })}</span><b>${c.name}</b></button>`).join('')}</div>
      <div class="subrow"><button class="chip sm" data-x="set">${icon('gear', 16)} ${CHORD_SETS[settings.get('chordSet')]?.name}</button><button class="chip sm" data-x="tone">Tone: ${settings.get('tone')}</button></div>`;
  };
  const lineY = () => S.H * 0.58;
  const doStrum = (dir, vel, x) => {
    const now = performance.now(); if (now - lastStrum < 70) return; lastStrum = now;
    snd.strum(chords[cur], dir, vel); strings = 1; sdir = dir;
    haptics.light();
    burst(x, lineY(), color, 10 + Math.round(vel * 10));
    if (!challenge) bigRead(`<b>${chords[cur].name}</b><small>${dir > 0 ? 'down' : 'up'} strum</small>`, color);
    pushHistory(chords[cur].name, color);
    if (challenge && ch.phase === 'play') {
      if (cur === ch.target) {
        ch.combo++; const pts = 10 * Math.min(5, 1 + Math.floor(ch.combo / 3)); ch.score += pts;
        audio.play('correct', { volume: settings.get('uiVol'), rate: 1 + Math.min(ch.combo, 10) * 0.03 }); haptics.medium();
        burst(S.W / 2, S.H * 0.3, '#ffc94a', 24, `+${pts}`);
        let n; do n = Math.floor(Math.random() * 6); while (n === ch.target); ch.target = n; renderTarget();
      } else { ch.combo = 0; sfx('wrong'); haptics.error(); renderTarget(); }
    }
  };
  const setChord = i => { if (i === cur) return; cur = i; bottom.querySelectorAll('.cc').forEach((b, k) => b.classList.toggle('on', k === cur)); };
  const renderTarget = () => {
    if (!challenge) return;
    const tgt = chords[ch.target];
    S.root.querySelector('.bigread').innerHTML = ch.phase === 'play' ? `<div class="target"><span>Play</span><b>${tgt.name}</b><i>${handSVG(FINGER_ICON(ch.target), { size: 54, glow: color })}</i><em>${ch.score} pts${ch.combo > 2 ? ` · combo x${Math.min(5, 1 + Math.floor(ch.combo / 3))}` : ''}</em></div>` : '';
    S.root.querySelector('.bigread').style.setProperty('--c', color);
  };
  const startRound = () => {
    ch.phase = 'count'; ch.score = 0; ch.combo = 0; let n = 3;
    const tick = () => {
      if (!S || ch.phase !== 'count') return;
      if (n > 0) { bigRead(`<b class="count">${n}</b>`, color); sfx('countdown'); haptics.tap(); n--; setTimeout(tick, 750); }
      else { sfx('go'); ch.phase = 'play'; ch.endsAt = performance.now() + 45000; ch.target = 1 + Math.floor(Math.random() * 5); renderTarget(); }
    };
    tick();
  };
  const endRound = () => {
    ch.phase = 'done'; const nb = ch.score > ch.best;
    if (nb) { ch.best = ch.score; storage.set('bestChallenge', ch.score); }
    sfx(nb ? 'levelup' : 'star'); haptics.success();
    sheet.open(`<div class="results"><div class="rart">${MODE_ART.challenge}</div><h2>${nb ? 'New best!' : 'Time!'}</h2><div class="score">${ch.score}</div><p>Best: ${ch.best} pts</p>
      <button class="btn primary" data-s="again">${icon('play')} Play again</button><button class="btn ghost" data-s="free">Free play</button></div>`,
    k => { if (k === 'again') startRound(); else { ch.phase = 'idle'; S.root.querySelector('.bigread').innerHTML = ''; } return true; }, { dismiss: () => { ch.phase = 'idle'; } });
  };
  return {
    enter() {
      renderChips(); snd.warmGuitar(chords);
      if (challenge) { S.root.querySelector('.bigread').innerHTML = `<div class="target"><span>Best ${ch.best} pts</span><b style="font-size:26px">Ready?</b><button class="btn primary sm" data-x="start">${icon('play')} Start 45s round</button></div>`; }
    },
    exit() { ch.phase = 'idle'; },
    click(b) {
      if (b.dataset.c != null) { sfx('ui_tap'); setChord(+b.dataset.c); doStrum(1, 0.8, S.W * 0.7); }
      else if (b.dataset.x === 'start') { sfx('ui_confirm'); startRound(); }
      else if (b.dataset.x === 'set') { sfx('ui_tap'); const ks = Object.keys(CHORD_SETS); settings.set('chordSet', ks[(ks.indexOf(settings.get('chordSet')) + 1) % ks.length]); chords = chordSet(); snd.warmGuitar(chords); renderChips(); toast(CHORD_SETS[settings.get('chordSet')].name); }
      else if (b.dataset.x === 'tone') { sfx('ui_tap'); const ts = ['acoustic', 'nylon', 'electric', 'drive']; settings.set('tone', ts[(ts.indexOf(settings.get('tone')) + 1) % ts.length]); snd.warmGuitar(chords); renderChips(); }
    },
    update(hands, dt, now) {
      if (challenge && ch.phase === 'play') { const left = (ch.endsAt - now) / 1000; S.root.style.setProperty('--timer', clamp(left / 45, 0, 1)); if (left <= 0) endRound(); }
      strings = Math.max(0, strings - dt * 1.6);
      if (!hands.length) { prevY = null; return; }
      const chordH = hands[0], strumH = hands[hands.length - 1];
      if (chordH.count === cand) candN++; else { cand = chordH.count; candN = 1; }
      if (candN >= 3) setChord(cand);
      if (hands.length !== prevN) { prevY = null; prevN = hands.length; }
      const y = strumH.cy, L = lineY();
      if (prevY != null) {
        const speed = Math.abs(y - prevY) / Math.max(dt, 0.008);
        const minSp = S.H * 0.45 / sens();
        if (speed > minSp && ((prevY < L - 6 && y >= L - 6) || (prevY > L + 6 && y <= L + 6))) doStrum(y > prevY ? 1 : -1, clamp(speed / (S.H * 3), 0.3, 1), strumH.cx);
      }
      prevY = y;
    },
    touch(type, p, q) {
      if (type === 'move' && q) {
        const L = lineY(), dtt = Math.max(8, p.t - q.pt) / 1000, speed = Math.abs(p.y - q.py) / dtt;
        if ((q.py < L && p.y >= L) || (q.py > L && p.y <= L)) doStrum(p.y > q.py ? 1 : -1, clamp(speed / (S.H * 3), 0.35, 1), p.x);
      }
    },
    draw(g, W, H, now) {
      const L = lineY(), multi = S.hands.length > 1, x0 = multi && !settings.get('lefty') ? W * 0.42 : (multi ? 0 : 0), x1 = multi && settings.get('lefty') ? W * 0.58 : W;
      // strings
      for (let i = 0; i < 6; i++) {
        const y = L - 50 + i * 20, amp = strings * (6 - i * 0.6) * Math.sin(now / 18 + i);
        g.strokeStyle = i < 3 ? 'rgba(255,201,74,.55)' : 'rgba(255,245,234,.45)'; g.lineWidth = 3 - i * 0.35;
        g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + amp, x1, y); g.stroke();
      }
      // strum line
      g.save(); g.setLineDash([14, 10]); g.lineDashOffset = -now / 30; g.strokeStyle = color; g.lineWidth = 3; g.shadowColor = color; g.shadowBlur = 12;
      g.beginPath(); g.moveTo(x0 + 10, L); g.lineTo(x1 - 10, L); g.stroke(); g.restore();
      g.fillStyle = 'rgba(255,245,234,.8)'; g.font = '600 13px Outfit, sans-serif'; g.textAlign = 'center'; g.fillText('swipe across the line to strum ↕', (x0 + x1) / 2, L + 76);
      if (S.hands.length) { const h = S.hands[0]; g.fillStyle = color; g.font = '800 30px Outfit, sans-serif'; g.textAlign = 'center'; g.shadowColor = '#000'; g.shadowBlur = 10; g.fillText(chords[cur].name, h.cx, h.cy - h.palm * 1.9); g.shadowBlur = 0; }
    }
  };
}

function pianoMode() {
  let notes = pianoNotes(); const color = MODES.piano.color, lit = new Array(8).fill(0), state = new Map();
  const bottom = S.root.querySelector('.bottom');
  const render = () => {
    bottom.innerHTML = `<div class="keys">${notes.map((n, i) => `<button class="key" data-k="${i}"><b>${snd.pc(n)}</b><small>${i < 4 ? 'L' : 'R'}${i < 4 ? 4 - i : i - 3}</small></button>`).join('')}</div>
    <div class="subrow"><button class="chip sm" data-x="root">Key: ${ROOTS[settings.get('root')]}</button><button class="chip sm" data-x="scale">${SCALES[settings.get('scale')].name}</button><button class="chip sm" data-x="oct-">${icon('minus', 14)}</button><span class="oct">Oct ${settings.get('octave')}</span><button class="chip sm" data-x="oct+">${icon('plus', 14)}</button></div>`;
  };
  const hit = (i, x, y, vel = 0.85) => {
    snd.pianoNote(notes[i], vel); lit[i] = 1; haptics.light();
    const k = bottom.querySelectorAll('.key')[i]; k?.classList.add('down'); setTimeout(() => k?.classList.remove('down'), 160);
    burst(x, y, color, 12, snd.pc(notes[i])); bigRead(`<b>${snd.noteName(notes[i])}</b>`, color); pushHistory(snd.pc(notes[i]), color);
  };
  const re = () => { notes = pianoNotes(); snd.warmPiano(notes); render(); };
  return {
    enter() { re(); },
    click(b) {
      if (b.dataset.k != null) { const r = b.getBoundingClientRect(); hit(+b.dataset.k, r.left + r.width / 2, r.top); return; }
      const x = b.dataset.x; if (!x) return; sfx('ui_tap');
      if (x === 'root') settings.set('root', (settings.get('root') + 1) % 7);
      if (x === 'scale') { const k = Object.keys(SCALES); settings.set('scale', k[(k.indexOf(settings.get('scale')) + 1) % k.length]); }
      if (x === 'oct-') settings.set('octave', Math.max(2, settings.get('octave') - 1));
      if (x === 'oct+') settings.set('octave', Math.min(6, settings.get('octave') + 1));
      re();
    },
    update(hands) {
      const on = 0.34 * sens(), off = 0.5 * sens(), seen = new Set();
      hands.forEach(h => {
        const side = h.cx < S.W / 2 ? 'L' : 'R';
        h.pinch.forEach((v, f) => {
          const key = side + f; seen.add(key);
          const was = state.get(key);
          if (!was && v < on) { state.set(key, true); const idx = side === 'L' ? 3 - f : 4 + f; const tip = h.pts[8 + f * 4]; hit(idx, tip.x, tip.y); }
          else if (was && v > off) state.set(key, false);
        });
      });
      for (const k of [...state.keys()]) if (!seen.has(k)) state.delete(k);
      for (let i = 0; i < 8; i++) lit[i] = Math.max(0, lit[i] - 0.05);
    },
    draw(g) {
      S.hands.forEach(h => h.pinch.forEach((v, f) => {
        const a = h.pts[4], b = h.pts[8 + f * 4], close = clamp(1 - (v - 0.2) / 0.5, 0, 1);
        if (close < 0.15) return;
        g.strokeStyle = color; g.globalAlpha = close * 0.8; g.lineWidth = 2 + close * 4; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.globalAlpha = 1;
      }));
    }
  };
}

function drumsMode() {
  const color = MODES.drums.color, prev = [], armed = [true, true];
  const PADS = [
    { id: 'hat', n: 'Hi-hat', x: 0.2, y: 0.4, r: 0.13, c: '#ffc94a' }, { id: 'crash', n: 'Crash', x: 0.8, y: 0.36, r: 0.14, c: '#ff4f9a' },
    { id: 'snare', n: 'Snare', x: 0.3, y: 0.6, r: 0.15, c: '#fff5ea' }, { id: 'tom1', n: 'Tom', x: 0.68, y: 0.57, r: 0.13, c: '#3ef0d0' },
    { id: 'tom2', n: 'Floor', x: 0.8, y: 0.76, r: 0.13, c: '#b57cff' }, { id: 'kick', n: 'Kick', x: 0.42, y: 0.82, r: 0.17, c: '#ff6a3d' }
  ].map(p => ({ ...p, flash: 0, last: 0 }));
  const geo = p => { const m = Math.min(S.W, S.H * 0.62); return { x: p.x * S.W, y: p.y * S.H, r: p.r * m * 1.25 }; };
  const hitPad = (p, vel) => {
    const now = performance.now(); if (now - p.last < 110) return; p.last = now; p.flash = 1;
    snd.drum(p.id, vel); p.id === 'kick' || p.id === 'crash' ? haptics.medium() : haptics.light();
    const q = geo(p); burst(q.x, q.y, p.c, 8 + Math.round(vel * 12)); pushHistory(p.n, p.c);
  };
  const padAt = (x, y) => PADS.find(p => { const q = geo(p); return Math.hypot(x - q.x, y - q.y) < q.r; });
  return {
    enter() { S.root.querySelector('.bottom').innerHTML = `<div class="tip">Flick a fingertip down onto a drum. Tap works too.</div>`; },
    update(hands, dt) {
      hands.slice(0, 2).forEach((h, i) => {
        const tip = h.pts[8];
        if (prev[i]) {
          const vy = (tip.y - prev[i].y) / Math.max(dt, 0.008), thr = S.H * 1.1 / sens();
          const pad = padAt(tip.x, tip.y);
          if (pad && vy > thr && armed[i]) { hitPad(pad, clamp(vy / (S.H * 3.5), 0.35, 1)); armed[i] = false; }
          if (vy < -S.H * 0.25 || !pad) armed[i] = true;
        }
        prev[i] = { x: tip.x, y: tip.y };
      });
      if (hands.length < 2) prev.length = hands.length;
      PADS.forEach(p => p.flash = Math.max(0, p.flash - dt * 4));
    },
    touch(type, p) { if (type === 'down') { const pad = padAt(p.x, p.y); if (pad) hitPad(pad, 0.85); } },
    draw(g) {
      PADS.forEach(p => {
        const q = geo(p), f = p.flash, r = q.r * (1 + f * 0.06);
        g.save(); g.shadowColor = p.c; g.shadowBlur = 10 + f * 30;
        const gr = g.createRadialGradient(q.x - r * 0.3, q.y - r * 0.35, r * 0.1, q.x, q.y, r);
        gr.addColorStop(0, `rgba(255,245,234,${0.35 + f * 0.5})`); gr.addColorStop(1, 'rgba(28,21,56,.55)');
        g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, r, 0, 7); g.fill();
        g.lineWidth = 6; g.strokeStyle = p.c; g.stroke(); g.restore();
        g.lineWidth = 2; g.strokeStyle = 'rgba(255,245,234,.35)'; g.beginPath(); g.arc(q.x, q.y, r * 0.78, 0, 7); g.stroke();
        g.fillStyle = '#fff5ea'; g.font = '700 15px Outfit, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.n, q.x, q.y);
      });
    }
  };
}

function thereminMode() {
  const color = MODES.theremin.color; let on = false, curMidi = 60, curVol = 0, phase = 0, lastNote = '';
  const bottom = S.root.querySelector('.bottom');
  const render = () => { bottom.innerHTML = `<div class="subrow">${['sine', 'triangle', 'sawtooth', 'square'].map(w => `<button class="chip sm ${settings.get('wave') === w ? 'on' : ''}" data-w="${w}">${{ sine: 'Ghost', triangle: 'Flute', sawtooth: 'Synth', square: 'Chip' }[w]}</button>`).join('')}<button class="chip sm ${settings.get('snap') ? 'on' : ''}" data-x="snap">Snap to scale</button></div><div class="tip">Right hand up/down = pitch · left hand = volume · fist = silence</div>`; };
  const top = () => S.H * 0.14, span = () => S.H * 0.62;
  const yToMidi = y => { const base = 12 * (settings.get('octave')) + [0, 2, 4, 5, 7, 9, 11][settings.get('root')]; let m = base + 24 * clamp(1 - (y - top()) / span(), 0, 1); if (settings.get('snap')) { const sc = SCALES[settings.get('scale')].steps.slice(0, -1).map(s => s % 12); let best = Math.round(m); for (let d = 0; d < 7; d++) { if (sc.includes(((Math.round(m) - base + d) % 12 + 12) % 12)) { best = Math.round(m) + d; break; } if (sc.includes(((Math.round(m) - base - d) % 12 + 12) % 12)) { best = Math.round(m) - d; break; } } m = best; } return m; };
  const set = (midi, vol) => {
    on = true; curMidi = midi; curVol = vol; snd.thereminSet(snd.mtof(midi), vol);
    const nm = snd.noteName(Math.round(midi)); if (nm !== lastNote) { lastNote = nm; bigRead(`<b>${nm}</b>`, color); }
  };
  const off = () => { if (on) { on = false; snd.thereminOff(); } };
  return {
    enter() { render(); },
    exit() { off(); },
    click(b) {
      if (b.dataset.w) { sfx('ui_tap'); settings.set('wave', b.dataset.w); snd.thereminOff(true); on = false; render(); }
      if (b.dataset.x === 'snap') { sfx('ui_toggle'); settings.set('snap', !settings.get('snap')); render(); }
    },
    update(hands) {
      if (S.pointers.size) return;
      if (!hands.length) return off();
      const ph = hands[hands.length - 1], vh = hands.length > 1 ? hands[0] : null;
      if (ph.count === 0) return off();
      const vol = vh ? clamp(1 - (vh.cy - top()) / span(), 0.05, 1) : 0.7;
      set(yToMidi(ph.pts[8].y), vol);
    },
    touch(type, p) { if (type === 'up') return off(); set(yToMidi(p.y), clamp(0.3 + p.x / S.W * 0.7, 0, 1)); },
    draw(g, W, H, now) {
      // pitch rail
      const x = settings.get('lefty') ? 26 : W - 26, base = 12 * settings.get('octave') + [0, 2, 4, 5, 7, 9, 11][settings.get('root')];
      g.strokeStyle = 'rgba(255,245,234,.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, top()); g.lineTo(x, top() + span()); g.stroke();
      const sc = SCALES[settings.get('scale')].steps.slice(0, -1);
      for (let o = 0; o < 2; o++) sc.forEach(s => { const m = base + o * 12 + s, y = top() + span() * (1 - (m - base) / 24); g.fillStyle = s === 0 ? color : 'rgba(255,245,234,.6)'; g.fillRect(x - (s === 0 ? 12 : 7), y - 1.5, s === 0 ? 24 : 14, 3); if (s === 0) { g.font = '700 12px Outfit'; g.textAlign = settings.get('lefty') ? 'left' : 'right'; g.fillText(snd.pc(m), x + (settings.get('lefty') ? 16 : -16), y + 4); } });
      // wave
      phase += 0.05 + (curMidi - 48) / 400;
      const amp = on ? 18 + curVol * 60 : 4, k = 0.012 + (curMidi - 40) / 2600, cy = H * 0.5;
      g.save(); g.shadowColor = color; g.shadowBlur = on ? 22 : 4; g.strokeStyle = color; g.lineWidth = 4; g.beginPath();
      for (let px = 0; px <= W; px += 6) { const t = px * k + phase * 6; const w = settings.get('wave'); let v = Math.sin(t); if (w === 'square') v = Math.sign(v) * 0.8; if (w === 'sawtooth') v = ((t / Math.PI) % 2) - 1; if (w === 'triangle') v = Math.asin(Math.sin(t)) / 1.57; g.lineTo(px, cy + v * amp * Math.sin(px / W * Math.PI)); }
      g.stroke(); g.restore();
      if (on) { const y = top() + span() * (1 - (curMidi - base) / 24); g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 24; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.shadowBlur = 0; }
    }
  };
}

// Preview / demo hook: fake hands so screenshots show the overlay.
window.__demo = (mode) => {
  if (!S) return;
  const W = S.W, H = S.H;
  S.fake = now => {
    const t = now / 1000;
    if (mode === 'guitar') return [fakeHand(W * 0.24, H * 0.36, 95, [0, 1, 1, 0, 0], 0.15, true), fakeHand(W * 0.74, H * 0.5 + Math.sin(t * 5) * 110, 95, [1, 1, 1, 1, 1], -0.1)];
    if (mode === 'piano') return [fakeHand(W * 0.25, H * 0.45, 95, [1, 1, 1, 1, 1], 0.1, true, 2), fakeHand(W * 0.75, H * 0.45, 95, [1, 1, 1, 1, 1], -0.1, false)];
    if (mode === 'theremin') return [fakeHand(W * 0.22, H * 0.45, 90, [1, 1, 1, 1, 1], 0.1, true), fakeHand(W * 0.76, H * 0.36, 90, [1, 1, 0, 0, 0], -0.1)];
    return [fakeHand(W * 0.3, H * 0.5, 90, [0, 1, 0, 0, 0], 0.1, true), fakeHand(W * 0.7, H * 0.45, 90, [0, 1, 0, 0, 0], -0.1)];
  };
};
