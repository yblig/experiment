// Generates every SVG sprite + game icon into public/art/. Run: node art/build.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('public/art');
fs.mkdirSync(OUT, { recursive: true });
const O = '#140b2b';
const P = ['#ff4d5e', '#3d8bff', '#2fd27a', '#ffc93c'];
const PD = ['#c22a3d', '#1f5fc9', '#18a058', '#d99a12'];
const PL = ['#ffa0aa', '#9cc4ff', '#9ff5c4', '#fff0a8'];
let uid = 0;
const id = (p) => `${p}${uid++}`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const write = (name, s) => fs.writeFileSync(path.join(OUT, name + '.svg'), s);

function rg(c1, c2, c3, cx = '35%', cy = '30%') {
  const g = id('g');
  return [g, `<radialGradient id="${g}" cx="${cx}" cy="${cy}" r="80%"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></radialGradient>`];
}
function lg(c1, c2, vertical = true) {
  const g = id('l');
  return [g, `<linearGradient id="${g}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`];
}

// ---------- reusable parts (drawn in a local coordinate system) ----------
function blob(cx, cy, r, i, { face = true, mood = 'happy' } = {}) {
  const [g, d] = rg(PL[i], P[i], PD[i]);
  const s = r / 50;
  let f = '';
  if (face) {
    const ey = cy - 6 * s;
    f += `<ellipse cx="${cx - 16 * s}" cy="${ey}" rx="${8 * s}" ry="${10 * s}" fill="${O}"/><ellipse cx="${cx + 16 * s}" cy="${ey}" rx="${8 * s}" ry="${10 * s}" fill="${O}"/>`;
    f += `<circle cx="${cx - 13 * s}" cy="${ey - 4 * s}" r="${3.2 * s}" fill="#fff"/><circle cx="${cx + 19 * s}" cy="${ey - 4 * s}" r="${3.2 * s}" fill="#fff"/>`;
    f += `<ellipse cx="${cx - 30 * s}" cy="${cy + 10 * s}" rx="${7 * s}" ry="${4 * s}" fill="#ff5d8f" opacity=".5"/><ellipse cx="${cx + 30 * s}" cy="${cy + 10 * s}" rx="${7 * s}" ry="${4 * s}" fill="#ff5d8f" opacity=".5"/>`;
    if (mood === 'happy') f += `<path d="M${cx - 10 * s} ${cy + 12 * s}q${10 * s} ${11 * s} ${20 * s} 0" fill="none" stroke="${O}" stroke-width="${4.5 * s}" stroke-linecap="round"/>`;
    else f += `<ellipse cx="${cx}" cy="${cy + 16 * s}" rx="${7 * s}" ry="${8 * s}" fill="${O}"/>`;
  }
  return `<defs>${d}</defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})" stroke="${O}" stroke-width="${7 * s}"/>` +
    `<ellipse cx="${cx - 18 * s}" cy="${cy - 26 * s}" rx="${13 * s}" ry="${7 * s}" fill="#fff" opacity=".55" transform="rotate(-30 ${cx - 18 * s} ${cy - 26 * s})"/>` + f;
}
function ball(cx, cy, r) {
  const [g, d] = rg('#ffffff', '#f1f1f6', '#b9b6cc');
  const cp = id('c');
  const pent = (x, y, rr, rot = -90) => { let p = []; for (let k = 0; k < 5; k++) { const a = (rot + k * 72) * Math.PI / 180; p.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`); } return `<polygon points="${p.join(' ')}" fill="${O}"/>`; };
  let patches = '';
  for (let k = 0; k < 5; k++) { const a = (-90 + 36 + k * 72) * Math.PI / 180; patches += pent(cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95, r * 0.3, -90 + 36 + k * 72 + 180); }
  return `<defs>${d}<clipPath id="${cp}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})"/>` +
    `<g clip-path="url(#${cp})">${pent(cx, cy, r * 0.36)}${patches}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${O}" stroke-width="${r * 0.13}"/>` +
    `<ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.45}" rx="${r * 0.25}" ry="${r * 0.13}" fill="#fff" opacity=".6" transform="rotate(-30 ${cx - r * 0.35} ${cy - r * 0.45})"/>`;
}
function coin(cx, cy, r) {
  const [g, d] = rg('#fff6c0', '#ffc93c', '#d48a00');
  const s = r / 30;
  return `<defs>${d}</defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})" stroke="${O}" stroke-width="${4.5 * s}"/><circle cx="${cx}" cy="${cy}" r="${r * .66}" fill="none" stroke="#b86e00" stroke-width="${3 * s}" opacity=".6"/>` +
    `<path d="M${cx} ${cy - 11 * s}l${3.4 * s} ${7 * s} ${7.6 * s} ${1}-${5.5 * s} ${5.3 * s} ${1.3 * s} ${7.6 * s}-${6.8 * s}-${3.6 * s}-${6.8 * s} ${3.6 * s} ${1.3 * s}-${7.6 * s}-${5.5 * s}-${5.3 * s} ${7.6 * s}-${1}z" fill="#fff8d6"/>`;
}
function bomb(cx, cy, r) {
  const [g, d] = rg('#7a6a9e', '#3a2d5c', '#1b1233');
  const s = r / 30;
  return `<defs>${d}</defs><rect x="${cx - 7 * s}" y="${cy - r - 8 * s}" width="${14 * s}" height="${12 * s}" rx="${3 * s}" fill="#6b6385" stroke="${O}" stroke-width="${3.5 * s}"/>` +
    `<path d="M${cx} ${cy - r - 8 * s}q${4 * s}-${12 * s} ${16 * s}-${12 * s}" fill="none" stroke="#c9a46a" stroke-width="${4 * s}" stroke-linecap="round"/>` +
    `<circle cx="${cx + 18 * s}" cy="${cy - r - 20 * s}" r="${6 * s}" fill="#ffd23f"/><circle cx="${cx + 18 * s}" cy="${cy - r - 20 * s}" r="${3 * s}" fill="#fff"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})" stroke="${O}" stroke-width="${4.5 * s}"/><ellipse cx="${cx - 10 * s}" cy="${cy - 12 * s}" rx="${8 * s}" ry="${5 * s}" fill="#fff" opacity=".45" transform="rotate(-30 ${cx - 10 * s} ${cy - 12 * s})"/>`;
}
function star(cx, cy, r, fill = '#ffd23f') {
  let pts = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5; const rr = k % 2 ? r * .45 : r; pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`); }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${O}" stroke-width="${r * .14}" stroke-linejoin="round"/>`;
}

// ---------- sprites ----------
for (let i = 0; i < 4; i++) {
  write(`char_${i}`, svg(128, 128, blob(64, 64, 54, i)));
  write(`charO_${i}`, svg(128, 128, blob(64, 64, 54, i, { mood: 'oh' })));
  // tank pointing right
  {
    const [g, d] = lg(PL[i], PD[i]);
    write(`tank_${i}`, svg(128, 128, `<defs>${d}</defs>
      <rect x="14" y="16" width="92" height="24" rx="10" fill="#3a3352" stroke="${O}" stroke-width="6"/>
      <rect x="14" y="88" width="92" height="24" rx="10" fill="#3a3352" stroke="${O}" stroke-width="6"/>
      ${[24, 42, 60, 78, 96].map(x => `<rect x="${x - 3}" y="20" width="6" height="16" rx="2" fill="#5d567a"/><rect x="${x - 3}" y="92" width="6" height="16" rx="2" fill="#5d567a"/>`).join('')}
      <rect x="20" y="32" width="80" height="64" rx="16" fill="url(#${g})" stroke="${O}" stroke-width="6"/>
      <rect x="62" y="56" width="58" height="16" rx="6" fill="${PD[i]}" stroke="${O}" stroke-width="6"/>
      <circle cx="58" cy="64" r="22" fill="${P[i]}" stroke="${O}" stroke-width="6"/>
      <ellipse cx="50" cy="56" rx="9" ry="5" fill="#fff" opacity=".55"/>`));
  }
  // car pointing right
  {
    const [g, d] = lg(PL[i], PD[i]);
    write(`car_${i}`, svg(128, 80, `<defs>${d}</defs>
      <rect x="18" y="4" width="22" height="14" rx="5" fill="${O}"/><rect x="86" y="4" width="22" height="14" rx="5" fill="${O}"/>
      <rect x="18" y="62" width="22" height="14" rx="5" fill="${O}"/><rect x="86" y="62" width="22" height="14" rx="5" fill="${O}"/>
      <path d="M8 26q0-14 16-14h70q26 0 30 22v12q-4 22-30 22H24Q8 68 8 54z" fill="url(#${g})" stroke="${O}" stroke-width="6"/>
      <path d="M78 22q16 2 18 18-2 16-18 18z" fill="#a8e6ff" stroke="${O}" stroke-width="5"/>
      <path d="M30 24h34v32H30z" fill="${PD[i]}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="40" y="36" width="44" height="8" rx="3" fill="#fff" opacity=".85"/>
      <ellipse cx="34" cy="20" rx="12" ry="3.5" fill="#fff" opacity=".5"/>`));
  }
  // spaceship pointing right
  {
    const [g, d] = lg(PL[i], PD[i]);
    write(`ship_${i}`, svg(128, 128, `<defs>${d}</defs>
      <path d="M34 22l30 30H40z M34 106l30-30H40z" fill="${PD[i]}" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M118 64Q96 34 46 38L22 50v28l24 12q50 4 72-26z" fill="url(#${g})" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>
      <ellipse cx="78" cy="64" rx="16" ry="11" fill="#a8e6ff" stroke="${O}" stroke-width="5"/>
      <ellipse cx="73" cy="60" rx="6" ry="3" fill="#fff"/>
      <rect x="10" y="54" width="14" height="20" rx="5" fill="#ffb84d" stroke="${O}" stroke-width="5"/>`));
  }
  // bird facing right
  {
    const [g, d] = rg(PL[i], P[i], PD[i]);
    write(`bird_${i}`, svg(128, 110, `<defs>${d}</defs>
      <ellipse cx="60" cy="58" rx="46" ry="40" fill="url(#${g})" stroke="${O}" stroke-width="6"/>
      <path d="M14 56q-6-22 16-22 10 10 6 26z" fill="${PD[i]}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="48" cy="70" rx="22" ry="14" fill="${PL[i]}" stroke="${O}" stroke-width="5"/>
      <circle cx="80" cy="42" r="14" fill="#fff" stroke="${O}" stroke-width="5"/><circle cx="84" cy="43" r="6" fill="${O}"/>
      <path d="M96 58l26 6-26 10z" fill="#ff9f1c" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="44" cy="34" rx="12" ry="6" fill="#fff" opacity=".5" transform="rotate(-20 44 34)"/>`));
  }
  // paddle / mallet (top view)
  {
    const [g, d] = rg(PL[i], P[i], PD[i]);
    write(`mallet_${i}`, svg(128, 128, `<defs>${d}</defs><circle cx="64" cy="64" r="58" fill="url(#${g})" stroke="${O}" stroke-width="7"/><circle cx="64" cy="64" r="28" fill="${PD[i]}" stroke="${O}" stroke-width="5"/><circle cx="58" cy="56" r="10" fill="#fff" opacity=".5"/>`));
  }
}
write('ball', svg(64, 64, ball(32, 32, 28)));
write('coin', svg(64, 64, coin(32, 32, 27)));
write('bomb', svg(96, 110, bomb(48, 70, 34)));
write('star', svg(64, 64, star(32, 33, 28)));
write('puck', svg(64, 64, `<circle cx="32" cy="32" r="28" fill="#2a2540" stroke="${O}" stroke-width="5"/><circle cx="32" cy="32" r="18" fill="none" stroke="#5d567a" stroke-width="4"/><ellipse cx="24" cy="22" rx="8" ry="4" fill="#fff" opacity=".35"/>`));
write('crown', svg(160, 120, `<defs>${lg('#fff2a8', '#f0a500')[1]}</defs><path d="M14 98L8 26l40 32 32-46 32 46 40-32-6 72z" fill="url(#l${uid - 1})" stroke="${O}" stroke-width="8" stroke-linejoin="round"/><rect x="14" y="92" width="132" height="20" rx="6" fill="#f0a500" stroke="${O}" stroke-width="7"/><circle cx="80" cy="70" r="10" fill="#ff4d5e" stroke="${O}" stroke-width="5"/><circle cx="44" cy="76" r="7" fill="#3d8bff" stroke="${O}" stroke-width="4"/><circle cx="116" cy="76" r="7" fill="#2fd27a" stroke="${O}" stroke-width="4"/>`));
{
  const [g, d] = lg('#fff2a8', '#e39400');
  write('trophy', svg(160, 170, `<defs>${d}</defs><path d="M38 30H14q0 44 36 50M122 30h24q0 44-36 50" fill="none" stroke="${O}" stroke-width="16" stroke-linecap="round"/><path d="M38 30H14q0 44 36 50M122 30h24q0 44-36 50" fill="none" stroke="#f0a500" stroke-width="8" stroke-linecap="round"/>
  <path d="M34 14h92v34q0 50-46 56-46-6-46-56z" fill="url(#${g})" stroke="${O}" stroke-width="8" stroke-linejoin="round"/><rect x="68" y="102" width="24" height="26" fill="#e39400" stroke="${O}" stroke-width="7"/><rect x="40" y="126" width="80" height="30" rx="8" fill="#7a4b9c" stroke="${O}" stroke-width="8"/><ellipse cx="60" cy="40" rx="9" ry="20" fill="#fff" opacity=".5"/>${star(80, 52, 18, '#fff8d6')}`));
}
write('knife', svg(40, 140, `<path d="M20 4q16 30 12 80H8Q4 34 20 4z" fill="#e6ecf5" stroke="${O}" stroke-width="5" stroke-linejoin="round"/><path d="M20 10q8 30 6 74h-6z" fill="#fff" opacity=".8"/><rect x="4" y="82" width="32" height="10" rx="4" fill="#5d567a" stroke="${O}" stroke-width="4"/><rect x="11" y="92" width="18" height="44" rx="7" fill="#9b5b34" stroke="${O}" stroke-width="5"/>`));
{
  const [g, d] = rg('#f6c48a', '#d08a4b', '#9b5b34', '50%', '50%');
  write('log', svg(260, 260, `<defs>${d}</defs><circle cx="130" cy="130" r="120" fill="url(#${g})" stroke="${O}" stroke-width="10"/>${[90, 62, 34].map(r => `<circle cx="130" cy="130" r="${r}" fill="none" stroke="#9b5b34" stroke-width="6" opacity=".55"/>`).join('')}<circle cx="130" cy="130" r="10" fill="#9b5b34"/>`));
}
write('target', svg(160, 160, `<circle cx="80" cy="80" r="74" fill="#fff" stroke="${O}" stroke-width="8"/><circle cx="80" cy="80" r="56" fill="#ff4d5e"/><circle cx="80" cy="80" r="40" fill="#fff"/><circle cx="80" cy="80" r="24" fill="#ff4d5e"/><circle cx="80" cy="80" r="10" fill="#fff"/>`));
{
  const [g, d] = rg('#d9a57a', '#a8704a', '#6e452b');
  write('mole', svg(140, 140, `<defs>${d}</defs><path d="M20 140V70q0-56 50-56t50 56v70z" fill="url(#${g})" stroke="${O}" stroke-width="7"/><ellipse cx="70" cy="86" rx="30" ry="22" fill="#f3d2b3"/><circle cx="52" cy="56" r="8" fill="${O}"/><circle cx="88" cy="56" r="8" fill="${O}"/><circle cx="54" cy="53" r="3" fill="#fff"/><circle cx="90" cy="53" r="3" fill="#fff"/><ellipse cx="70" cy="72" rx="11" ry="8" fill="#ff7aa2" stroke="${O}" stroke-width="4"/><rect x="62" y="84" width="7" height="10" fill="#fff" stroke="${O}" stroke-width="2"/><rect x="71" y="84" width="7" height="10" fill="#fff" stroke="${O}" stroke-width="2"/>`));
}
write('meteor', svg(110, 110, `<defs>${rg('#ffcf8a', '#c4623a', '#6a2a1a')[1]}</defs><path d="M55 6l22 10 24 4 4 26-6 24-16 22-26 12-24-8L10 78 4 50l12-26z" fill="url(#g${uid - 1})" stroke="${O}" stroke-width="7" stroke-linejoin="round"/><circle cx="40" cy="44" r="10" fill="#8a3a22" opacity=".7"/><circle cx="68" cy="70" r="13" fill="#8a3a22" opacity=".7"/><circle cx="72" cy="34" r="6" fill="#8a3a22" opacity=".7"/>`));
write('cpu', svg(96, 96, `<rect x="14" y="26" width="68" height="54" rx="16" fill="#cfd6ea" stroke="${O}" stroke-width="6"/><rect x="44" y="8" width="8" height="18" fill="${O}"/><circle cx="48" cy="10" r="7" fill="#ff4d5e" stroke="${O}" stroke-width="4"/><rect x="24" y="38" width="48" height="24" rx="10" fill="#2a2540"/><circle cx="37" cy="50" r="6" fill="#00e5ff"/><circle cx="59" cy="50" r="6" fill="#00e5ff"/><rect x="34" y="68" width="28" height="5" rx="2" fill="${O}"/><rect x="4" y="44" width="10" height="22" rx="4" fill="#9aa3c0" stroke="${O}" stroke-width="4"/><rect x="82" y="44" width="10" height="22" rx="4" fill="#9aa3c0" stroke="${O}" stroke-width="4"/>`));
// hands for rock-paper-scissors
write('rps_0', svg(140, 140, `<path d="M30 70q0-30 30-34h30q22 0 22 24v34q0 26-30 30H58q-28 0-28-30z" fill="#ffd2a8" stroke="${O}" stroke-width="7" stroke-linejoin="round"/>${[52, 72, 92].map(x => `<path d="M${x - 8} 38v26" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`).join('')}<path d="M30 80q20-4 26 12" fill="none" stroke="${O}" stroke-width="6" stroke-linecap="round"/>`));
write('rps_1', svg(140, 140, `<path d="M38 132V44q0-16 12-16t12 16v-10q0-14 12-14t12 14v6q0-12 12-12t12 12v76q0 26-26 26H64q-26 0-26-10z" fill="#ffd2a8" stroke="${O}" stroke-width="7" stroke-linejoin="round"/><path d="M38 84q-20-14-28 0 6 22 28 32" fill="#ffd2a8" stroke="${O}" stroke-width="7" stroke-linejoin="round"/>`));
write('rps_2', svg(140, 140, `<path d="M36 130q-6-40 10-56l-8-56q2-12 14-10l14 50 8-54q12-4 16 8l-6 64q20 10 16 40-4 20-32 20H58q-20 0-22-6z" fill="#ffd2a8" stroke="${O}" stroke-width="7" stroke-linejoin="round"/>`));
// UI icons (white glyphs)
const ic = (name, body) => write('ic_' + name, svg(96, 96, `<g fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">${body}</g>`));
ic('pause', '<path d="M34 24v48M62 24v48"/>');
ic('home', '<path d="M16 46L48 18l32 28M26 38v38h44V38"/><path d="M42 76V56h12v20"/>');
ic('retry', '<path d="M74 48a26 26 0 1 1-8-19"/><path d="M68 14v18H50" />');
ic('gear', '<circle cx="48" cy="48" r="13"/><path d="M48 12v12M48 72v12M12 48h12M72 48h12M22 22l9 9M65 65l9 9M74 22l-9 9M31 65l-9 9"/>');
ic('music', '<path d="M38 70V22l36-8v48"/><circle cx="30" cy="70" r="10" fill="#fff"/><circle cx="66" cy="62" r="10" fill="#fff"/>');
ic('sound', '<path d="M18 38h14l18-14v48L32 58H18z" fill="#fff"/><path d="M62 34q10 14 0 28M72 24q20 24 0 48"/>');
ic('vibrate', '<rect x="32" y="16" width="32" height="64" rx="8"/><path d="M16 36v24M80 36v24"/>');
ic('back', '<path d="M58 18L28 48l30 30"/>');
ic('play', '<path d="M34 20l40 28-40 28z" fill="#fff"/>');
ic('trophy', '<path d="M30 18h36v18q0 22-18 24-18-2-18-24z" fill="#fff"/><path d="M30 26H18q0 16 14 20M66 26h12q0 16-14 20M48 60v14M34 78h28"/>');
ic('info', '<circle cx="48" cy="48" r="34"/><path d="M48 44v24M48 30v2"/>');
ic('next', '<path d="M38 18l30 30-30 30"/>');

// ---------- game icons ----------
function icon(name, c1, c2, inner) {
  const [g, d] = lg(c1, c2);
  write('gi_' + name, svg(200, 200, `<defs>${d}<clipPath id="cp${uid}"><rect x="8" y="8" width="184" height="184" rx="40"/></clipPath></defs>
  <rect x="8" y="14" width="184" height="184" rx="40" fill="${O}"/>
  <rect x="8" y="8" width="184" height="184" rx="40" fill="url(#${g})"/>
  <g clip-path="url(#cp${uid++})">${inner}<ellipse cx="70" cy="20" rx="90" ry="34" fill="#fff" opacity=".12"/></g>
  <rect x="8" y="8" width="184" height="184" rx="40" fill="none" stroke="${O}" stroke-width="8"/>`));
}
const ring = (cx, cy, r, c, w = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
const use = (file, x, y, w, h, rot = 0) => {
  const raw = fs.readFileSync(path.join(OUT, file + '.svg'), 'utf8');
  const vb = raw.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const inner = raw.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replace(/id="([^"]+)"/g, (m, a) => `id="${a}_${file}${x}${y}"`).replace(/url\(#([^)]+)\)/g, (m, a) => `url(#${a}_${file}${x}${y})`);
  const sx = w / vb[2], sy = h / vb[3];
  return `<g transform="translate(${x} ${y}) rotate(${rot} ${w / 2} ${h / 2}) scale(${sx} ${sy})">${inner}</g>`;
};

icon('sumo', '#ff9a5a', '#e0433a', `<ellipse cx="100" cy="110" rx="84" ry="70" fill="#f4dcae" stroke="${O}" stroke-width="7"/>${ring(100, 110, 60, '#c45a3a', 6)}${use('char_0', 34, 70, 74, 74)}${use('char_1', 98, 66, 74, 74)}<path d="M88 66l10-16 6 14" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`);
icon('tank', '#8fbf5a', '#3f7d3a', `<rect x="20" y="30" width="30" height="30" rx="6" fill="#6b4f2a" stroke="${O}" stroke-width="5"/><rect x="150" y="130" width="30" height="30" rx="6" fill="#6b4f2a" stroke="${O}" stroke-width="5"/>${use('tank_1', 22, 70, 100, 100, -20)}<circle cx="150" cy="70" r="12" fill="#ffd23f" stroke="${O}" stroke-width="5"/><circle cx="174" cy="58" r="6" fill="#ffd23f"/>`);
icon('snake', '#2b2160', '#120a2e', `<path d="M30 160q0-60 50-60t40-60 50 0" fill="none" stroke="${O}" stroke-width="26" stroke-linecap="round"/><path d="M30 160q0-60 50-60t40-60 50 0" fill="none" stroke="#2fd27a" stroke-width="16" stroke-linecap="round"/><path d="M40 40q40 30 0 70" fill="none" stroke="${O}" stroke-width="22" stroke-linecap="round"/><path d="M40 40q40 30 0 70" fill="none" stroke="#ff4d5e" stroke-width="12" stroke-linecap="round"/><circle cx="170" cy="40" r="16" fill="#2fd27a" stroke="${O}" stroke-width="6"/><circle cx="174" cy="36" r="4" fill="${O}"/>`);
icon('ship', '#3a2d7a', '#0e0a2b', `${[[30, 40], [160, 30], [50, 160], [170, 150], [110, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`).join('')}${use('ship_3', 30, 60, 100, 100, -30)}<path d="M128 84l40-20" stroke="#ff2bd6" stroke-width="10" stroke-linecap="round"/>${use('meteor', 130, 110, 56, 56)}`);
icon('meteor', '#ff9a5a', '#6a1f3a', `${use('meteor', 40, 18, 60, 60)}${use('meteor', 120, 50, 44, 44)}<path d="M30 10l30 30M110 40l20 20" stroke="#ffd23f" stroke-width="8" stroke-linecap="round" opacity=".7"/><rect x="0" y="160" width="200" height="40" fill="#3a2d5c"/>${use('char_2', 70, 108, 64, 64)}`);
icon('knife', '#5ac8fa', '#2a5fa8', `${use('log', 38, 38, 124, 124)}${use('knife', 88, 4, 24, 70, 180)}${use('knife', 140, 84, 24, 70, 270)}${use('knife', 92, 130, 22, 64)}`);
icon('jump', '#ffb84d', '#e0433a', `<circle cx="100" cy="110" r="70" fill="#ffe9c2" stroke="${O}" stroke-width="6"/><rect x="20" y="102" width="160" height="16" rx="8" fill="#5d567a" stroke="${O}" stroke-width="5" transform="rotate(-25 100 110)"/><circle cx="100" cy="110" r="14" fill="#5d567a" stroke="${O}" stroke-width="5"/>${use('char_0', 34, 30, 56, 56)}${use('char_1', 120, 130, 50, 50)}`);
icon('flappy', '#6dd5fa', '#2980b9', `<rect x="130" y="0" width="40" height="70" fill="#2fd27a" stroke="${O}" stroke-width="6"/><rect x="124" y="56" width="52" height="20" rx="4" fill="#2fd27a" stroke="${O}" stroke-width="6"/><rect x="130" y="140" width="40" height="70" fill="#2fd27a" stroke="${O}" stroke-width="6"/><rect x="124" y="134" width="52" height="20" rx="4" fill="#2fd27a" stroke="${O}" stroke-width="6"/>${use('bird_3', 30, 70, 90, 78)}`);
icon('coins', '#b06ab3', '#4568dc', `${use('coin', 30, 30, 50, 50)}${use('coin', 120, 40, 44, 44)}${use('coin', 140, 130, 40, 40)}${use('char_3', 56, 90, 80, 80)}`);
icon('bomb', '#ff6b35', '#a8152f', `${use('bomb', 50, 30, 100, 116)}<path d="M150 30l14-10M160 50h18M146 14l4-14" stroke="#ffd23f" stroke-width="7" stroke-linecap="round"/>`);
icon('sword', '#9b59b6', '#3a1c71', `<path d="M40 160L140 40" stroke="${O}" stroke-width="20" stroke-linecap="round"/><path d="M40 160L140 40" stroke="#e6ecf5" stroke-width="10" stroke-linecap="round"/><path d="M160 160L60 40" stroke="${O}" stroke-width="20" stroke-linecap="round"/><path d="M160 160L60 40" stroke="#e6ecf5" stroke-width="10" stroke-linecap="round"/><path d="M30 130l30 30M170 130l-30 30" stroke="${O}" stroke-width="16" stroke-linecap="round"/><path d="M30 130l30 30M170 130l-30 30" stroke="#ffc93c" stroke-width="8" stroke-linecap="round"/>${star(100, 92, 20, '#fff6c0')}`);
icon('target', '#56ab2f', '#1e5e2a', `${use('target', 50, 30, 100, 100)}<path d="M178 170L104 84" stroke="${O}" stroke-width="12" stroke-linecap="round"/><path d="M178 170L104 84" stroke="#c98a4b" stroke-width="6" stroke-linecap="round"/><path d="M104 84l20 4-6 6z" fill="#e6ecf5" stroke="${O}" stroke-width="4"/>`);
icon('soccer', '#4caf50', '#1b7a2f', `<rect x="20" y="20" width="160" height="160" rx="6" fill="none" stroke="#fff" stroke-width="6" opacity=".7"/>${ring(100, 100, 36, 'rgba(255,255,255,.7)', 6)}<rect x="60" y="0" width="80" height="20" fill="#fff" opacity=".8"/>${use('char_1', 120, 110, 60, 60)}${use('ball', 76, 70, 48, 48)}`);
icon('hockey', '#00d1ff', '#1f5fc9', `<rect x="18" y="18" width="164" height="164" rx="30" fill="#e8f6ff" stroke="${O}" stroke-width="6"/><path d="M18 100h164" stroke="#ff4d5e" stroke-width="5"/>${ring(100, 100, 26, '#3d8bff', 5)}${use('mallet_0', 70, 120, 56, 56)}${use('mallet_1', 74, 26, 56, 56)}${use('puck', 112, 86, 34, 34)}`);
icon('pong', '#1a1033', '#43307a', `<rect x="60" y="20" width="80" height="16" rx="8" fill="#3d8bff" stroke="${O}" stroke-width="5"/><rect x="60" y="164" width="80" height="16" rx="8" fill="#ff4d5e" stroke="${O}" stroke-width="5"/><rect x="20" y="60" width="16" height="80" rx="8" fill="#2fd27a" stroke="${O}" stroke-width="5"/><rect x="164" y="60" width="16" height="80" rx="8" fill="#ffc93c" stroke="${O}" stroke-width="5"/><circle cx="110" cy="90" r="14" fill="#fff" stroke="${O}" stroke-width="5"/><path d="M96 104l-30 30" stroke="#fff" stroke-width="6" opacity=".4" stroke-linecap="round"/>`);
icon('race', '#7f8c8d', '#2c3e50', `<rect x="0" y="40" width="200" height="120" fill="#4a4560"/><path d="M0 100h200" stroke="#fff" stroke-width="6" stroke-dasharray="22 16"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<rect x="${150 + (k % 2) * 12}" y="${40 + Math.floor(k / 2) * 30}" width="12" height="15" fill="#fff"/><rect x="${150 + ((k + 1) % 2) * 12}" y="${55 + Math.floor(k / 2) * 30}" width="12" height="15" fill="#fff"/>`).join('')}${use('car_0', 30, 50, 100, 62)}${use('car_1', 10, 106, 100, 62)}`);
icon('run', '#ffd23f', '#ff6b35', `<rect x="0" y="130" width="200" height="70" fill="#c0643a"/><path d="M0 150h200M0 176h200" stroke="#fff" stroke-width="4" opacity=".7"/><rect x="160" y="40" width="10" height="110" fill="#fff" stroke="${O}" stroke-width="4"/><path d="M170 44h26v34h-26" fill="#ff4d5e" stroke="${O}" stroke-width="4"/>${use('char_0', 30, 70, 70, 70)}${use('char_2', 90, 84, 60, 60)}<path d="M14 90h20M8 110h26" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`);
icon('tug', '#a1c4fd', '#6a5acd', `<path d="M10 106h180" stroke="${O}" stroke-width="16" stroke-linecap="round"/><path d="M10 106h180" stroke="#d9a35b" stroke-width="8" stroke-linecap="round" stroke-dasharray="10 6"/><rect x="94" y="94" width="12" height="40" fill="#ff4d5e" stroke="${O}" stroke-width="4"/>${use('char_0', 14, 60, 64, 64)}${use('char_1', 122, 60, 64, 64)}`);
icon('golf', '#7ed957', '#2e8b3a', `<path d="M0 150q50-30 100-10t100-10v70H0z" fill="#5cb83d"/><ellipse cx="140" cy="148" rx="20" ry="7" fill="${O}"/><rect x="138" y="50" width="6" height="98" fill="#fff" stroke="${O}" stroke-width="3"/><path d="M144 52l34 14-34 14z" fill="#ff4d5e" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><circle cx="56" cy="130" r="14" fill="#fff" stroke="${O}" stroke-width="5"/><path d="M56 130l-30-60" stroke="#fff" stroke-width="5" stroke-dasharray="6 8" opacity=".9"/>`);
icon('cowboy', '#f6d365', '#c0643a', `<circle cx="150" cy="50" r="26" fill="#fff6c0"/><path d="M0 160h200v40H0z" fill="#a0522d"/><path d="M20 160l20-60h20l10 60M140 160l10-60h20l20 60" fill="#7a3f1c"/><path d="M40 70h70l10-20h-50zM0 0" fill="#7a3f1c" stroke="${O}" stroke-width="5"/><ellipse cx="70" cy="72" rx="50" ry="10" fill="#9b5b34" stroke="${O}" stroke-width="5"/><text x="100" y="150" font-family="Arial Black, sans-serif" font-size="46" font-weight="900" fill="#ff4d5e" stroke="${O}" stroke-width="5" text-anchor="middle" paint-order="stroke">DOR!</text>`);
icon('color', '#f093fb', '#f5576c', `<rect x="26" y="40" width="148" height="76" rx="18" fill="#fff" stroke="${O}" stroke-width="6"/><text x="100" y="94" font-family="Arial Black, sans-serif" font-size="38" font-weight="900" fill="#3d8bff" text-anchor="middle">MERAH</text>${[0, 1, 2, 3].map(k => `<circle cx="${40 + k * 40}" cy="152" r="16" fill="${P[k]}" stroke="${O}" stroke-width="5"/>`).join('')}`);
icon('stop10', '#434343', '#000000', `<circle cx="100" cy="106" r="70" fill="#fff" stroke="${O}" stroke-width="7"/><rect x="88" y="18" width="24" height="18" rx="4" fill="#ff4d5e" stroke="${O}" stroke-width="5"/><path d="M100 106V56" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M100 106l30 18" stroke="#ff4d5e" stroke-width="8" stroke-linecap="round"/><text x="100" y="166" font-family="Arial Black, sans-serif" font-size="26" font-weight="900" fill="${O}" text-anchor="middle">10.00</text>`);
icon('mole', '#a8e063', '#56ab2f', `<ellipse cx="100" cy="160" rx="70" ry="22" fill="#5b3a1f" stroke="${O}" stroke-width="6"/>${use('mole', 50, 50, 100, 100)}<rect x="0" y="160" width="200" height="40" fill="#56ab2f"/><path d="M130 40l40-26 10 16-40 26z" fill="#c98a4b" stroke="${O}" stroke-width="5"/><rect x="118" y="30" width="30" height="40" rx="8" fill="#ff4d5e" stroke="${O}" stroke-width="5" transform="rotate(-34 133 50)"/>`);
icon('stack', '#43cea2', '#185a9d', `${[0, 1, 2, 3, 4].map(k => `<rect x="${50 + (k % 2 ? 8 : -6)}" y="${150 - k * 26}" width="${100 - k * 6}" height="24" rx="5" fill="${P[k % 4]}" stroke="${O}" stroke-width="5"/>`).join('')}<rect x="20" y="20" width="76" height="24" rx="5" fill="#ff8a5b" stroke="${O}" stroke-width="5"/><path d="M58 50v14" stroke="#fff" stroke-width="5" stroke-dasharray="4 4"/>`);
icon('math', '#ff9a9e', '#a855f7', `<rect x="22" y="30" width="156" height="90" rx="18" fill="#fff" stroke="${O}" stroke-width="6"/><text x="100" y="92" font-family="Arial Black, sans-serif" font-size="40" font-weight="900" fill="${O}" text-anchor="middle">3+4=7</text><circle cx="62" cy="156" r="22" fill="#2fd27a" stroke="${O}" stroke-width="5"/><path d="M52 156l8 8 14-16" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="138" cy="156" r="22" fill="#ff4d5e" stroke="${O}" stroke-width="5"/><path d="M128 146l20 20M148 146l-20 20" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`);
icon('memory', '#4facfe', '#6a3093', `<rect x="24" y="30" width="66" height="86" rx="12" fill="#fff" stroke="${O}" stroke-width="6"/>${star(57, 73, 22)}<rect x="110" y="30" width="66" height="86" rx="12" fill="#ff6b35" stroke="${O}" stroke-width="6"/><text x="143" y="88" font-family="Arial Black, sans-serif" font-size="40" font-weight="900" fill="#fff" text-anchor="middle">?</text><rect x="66" y="110" width="66" height="76" rx="12" fill="#fff" stroke="${O}" stroke-width="6" transform="rotate(10 99 148)"/>${star(99, 148, 20)}`);
icon('xo', '#fbc2eb', '#a18cd1', `<path d="M74 20v160M126 20v160M20 74h160M20 126h160" stroke="${O}" stroke-width="10" stroke-linecap="round" opacity=".8"/><path d="M30 30l32 32M62 30L30 62" stroke="#ff4d5e" stroke-width="12" stroke-linecap="round"/>${ring(100, 100, 18, '#3d8bff', 11)}<path d="M138 138l32 32M170 138l-32 32" stroke="#ff4d5e" stroke-width="12" stroke-linecap="round"/>${ring(152, 48, 18, '#3d8bff', 11)}`);
icon('connect4', '#3d8bff', '#1f3fa8', `<rect x="16" y="30" width="168" height="150" rx="16" fill="#1f5fc9" stroke="${O}" stroke-width="6"/>${[0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => { const col = (r === 3 && c < 3) || (r === 2 && c === 1) ? '#ff4d5e' : (r === 3 && c === 3) || (r === 2 && c === 2) || (r === 1 && c === 1) ? '#ffc93c' : '#0c1a4a'; return `<circle cx="${46 + c * 36}" cy="${60 + r * 34}" r="13" fill="${col}" stroke="${O}" stroke-width="3"/>`; }).join('')).join('')}`);
icon('ladder', '#f9d423', '#e65c00', `${[0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => `<rect x="${20 + c * 40}" y="${20 + r * 40}" width="40" height="40" fill="${(r + c) % 2 ? '#fff6e0' : '#ffd18a'}"/>`).join('')).join('')}<path d="M50 160L130 50M70 168l80-110" stroke="#9b5b34" stroke-width="8"/>${[0, 1, 2, 3].map(k => `<path d="M${62 + k * 18} ${144 - k * 26}l20 8" stroke="#9b5b34" stroke-width="6"/>`).join('')}<path d="M40 40q40 20 10 50t30 60" fill="none" stroke="${O}" stroke-width="16" stroke-linecap="round"/><path d="M40 40q40 20 10 50t30 60" fill="none" stroke="#2fd27a" stroke-width="9" stroke-linecap="round"/><rect x="128" y="128" width="46" height="46" rx="10" fill="#fff" stroke="${O}" stroke-width="5"/><circle cx="140" cy="140" r="5" fill="${O}"/><circle cx="162" cy="162" r="5" fill="${O}"/><circle cx="151" cy="151" r="5" fill="${O}"/>`);
icon('rps', '#ff758c', '#ff7eb3', `${use('rps_0', 10, 60, 80, 80)}${use('rps_2', 110, 60, 80, 80)}<text x="100" y="60" font-family="Arial Black, sans-serif" font-size="30" font-weight="900" fill="#fff" stroke="${O}" stroke-width="5" text-anchor="middle" paint-order="stroke">VS</text>`);
icon('random', '#f7c548', '#ff6b35', `<rect x="40" y="40" width="120" height="120" rx="24" fill="#fff" stroke="${O}" stroke-width="7" transform="rotate(12 100 100)"/>${[[70, 70], [130, 130], [100, 100], [130, 70], [70, 130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${O}" transform="rotate(12 100 100)"/>`).join('')}`);

// logo
write('logo', svg(900, 420, `
  <defs>${lg('#fff6c0', '#ffb84d')[1]}</defs>
  ${[0, 1, 2, 3].map(k => { const x = 120 + k * 220, y = 120 + (k % 2) * 16; const [g, d] = rg(PL[k], P[k], PD[k]); return `<defs>${d}</defs><circle cx="${x}" cy="${y}" r="92" fill="${O}"/><circle cx="${x}" cy="${y - 8}" r="92" fill="url(#${g})" stroke="${O}" stroke-width="12"/><ellipse cx="${x - 30}" cy="${y - 52}" rx="24" ry="12" fill="#fff" opacity=".55" transform="rotate(-30 ${x - 30} ${y - 52})"/><text x="${x}" y="${y + 36}" font-family="Lilita One, Arial Black, sans-serif" font-size="140" fill="#fff" stroke="${O}" stroke-width="14" text-anchor="middle" paint-order="stroke">${k + 1}</text>`; }).join('')}
`));
// app icon (foreground subject inside the middle 60%, full-bleed background)
fs.mkdirSync('art', { recursive: true });
{
  let fg = '';
  [[0, 380, 380], [1, 644, 380], [2, 380, 644], [3, 644, 644]].forEach(([k, x, y]) => {
    const [g, d] = rg(PL[k], P[k], PD[k]);
    fg += `<defs>${d}</defs><circle cx="${x}" cy="${y + 14}" r="128" fill="${O}" opacity=".5"/><circle cx="${x}" cy="${y}" r="124" fill="url(#${g})" stroke="${O}" stroke-width="16"/>` +
      `<ellipse cx="${x - 42}" cy="${y - 66}" rx="34" ry="17" fill="#fff" opacity=".55" transform="rotate(-30 ${x - 42} ${y - 66})"/>` +
      `<text x="${x}" y="${y + 58}" font-family="Lilita One, Arial Black, sans-serif" font-weight="900" font-size="170" fill="#fff" stroke="${O}" stroke-width="16" text-anchor="middle" paint-order="stroke">${k + 1}</text>`;
  });
  fs.writeFileSync('art/icon-fg.svg', svg(1024, 1024, fg));
  const [bg, bd] = lg('#4a2a9a', '#1a1033');
  let stripes = '';
  for (let k = -4; k < 12; k++) stripes += `<rect x="${k * 140}" y="-200" width="60" height="1500" fill="#fff" opacity=".05" transform="rotate(-20 512 512)"/>`;
  fs.writeFileSync('art/icon-bg.svg', svg(1024, 1024, `<defs>${bd}</defs><rect width="1024" height="1024" fill="url(#${bg})"/>${stripes}`));
}
console.log('art built:', fs.readdirSync(OUT).length, 'files');
