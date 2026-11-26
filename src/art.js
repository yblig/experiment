// Hand-authored SVG art: hand poses, mode illustrations, UI icons.

// Hand silhouette. ext = [thumb, index, middle, ring, pinky] (truthy = up). pinch = finger 1..4 touching thumb.
export function handSVG(ext = [1, 1, 1, 1, 1], { size = 96, color = '#ffd9b8', shade = '#f2b48c', line = '#2a1d3f', pinch = 0, glow = null } = {}) {
  const fingers = [
    { x: 66, y: 66, w: 15, L: 42, a: -45 },   // thumb (rotated)
    { x: 53, y: 50, w: 14, L: 44, a: -8 },
    { x: 69, y: 47, w: 14.5, L: 49, a: 0 },
    { x: 84, y: 50, w: 14, L: 45, a: 8 },
    { x: 98, y: 57, w: 12.5, L: 36, a: 16 }
  ];
  let out = '';
  fingers.forEach((f, i) => {
    const up = ext[i] && !(pinch && (i === 0 || i === pinch));
    let L = up ? f.L : f.L * 0.38, a = f.a;
    if (pinch && i === pinch) { L = f.L * 0.72; a = f.a - 28 - (pinch - 1) * 6; }
    if (pinch && i === 0) { L = f.L * 0.95; a = -18 + (pinch - 1) * 4; }
    const tx = i === 0 ? 60 : f.x, ty = i === 0 ? 80 : f.y;
    out += `<g transform="rotate(${a} ${tx} ${ty})"><rect x="${tx - f.w / 2}" y="${ty - L}" width="${f.w}" height="${L + 14}" rx="${f.w / 2}" fill="${up ? color : shade}" stroke="${line}" stroke-width="4"/>${up ? `<rect x="${tx - f.w / 2 + 3}" y="${ty - L + 4}" width="4" height="${Math.max(6, L * 0.45)}" rx="2" fill="#fff" opacity=".45"/>` : ''}</g>`;
  });
  const palm = `<path d="M44 58 Q44 46 56 46 L96 50 Q106 52 106 64 L104 98 Q100 118 76 120 Q52 120 46 100 Z" fill="${color}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M52 62 Q56 54 66 55" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>`;
  const halo = glow ? `<circle cx="76" cy="76" r="62" fill="${glow}" opacity=".16"/>` : '';
  const spark = pinch ? `<circle cx="${50 + pinch * 6}" cy="${36 + pinch}" r="7" fill="#fff" opacity=".9"/><circle cx="${50 + pinch * 6}" cy="${36 + pinch}" r="13" fill="none" stroke="#fff" stroke-width="2.5" opacity=".6"/>` : '';
  // thumb is drawn behind palm, other fingers too; palm on top except pinch thumb
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 140" width="${size}" height="${size * 140 / 152}">${halo}${out}${palm}${spark}</svg>`;
}

export const ICON = {
  back: '<path d="M15 5l-7 7 7 7" />',
  rec: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  loop: '<path d="M4 12a6 6 0 0 1 6-6h8m-3-3 3 3-3 3M20 12a6 6 0 0 1-6 6H6m3 3-3-3 3-3"/>',
  beat: '<path d="M4 18h16M7 18l3-12h4l3 12M10.5 12h3"/>',
  cam: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><path d="M9.5 13.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0"/><path d="M16 4.5l1.5 1.5L16 7.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  takes: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  minus: '<path d="M6 12h12"/>', plus: '<path d="M6 12h12M12 6v12"/>',
  hand: '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5V4.5a1.5 1.5 0 0 1 3 0V11V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6 7-2.5 0-4-1.2-5.5-3.2L3.8 14a1.6 1.6 0 0 1 2.4-2z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  touch: '<path d="M9 11V5.5a2 2 0 0 1 4 0V11l4.2.9a2 2 0 0 1 1.6 2.3L18 19.5H9.8L6.2 15a1.7 1.7 0 0 1 2.6-2.2L9 13"/>'
};
export const icon = (k, s = 24) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

// Mode illustrations (cards + headers)
export const MODE_ART = {
  guitar: `<svg viewBox="0 0 120 120"><defs><linearGradient id="gb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffa36b"/><stop offset="1" stop-color="#e2461c"/></linearGradient></defs>
    <g transform="rotate(-38 60 60)"><rect x="55" y="4" width="10" height="58" rx="3" fill="#5a3a22" stroke="#2a1d3f" stroke-width="3"/>
    <rect x="52" y="0" width="16" height="14" rx="4" fill="#2a1d3f"/>${[0, 1, 2, 3].map(i => `<rect x="${56 + i * 2.2}" y="16" width=".9" height="46" fill="#fff" opacity=".7"/>`).join('')}
    <path d="M60 52c14 0 20 8 18 18 6 4 10 12 8 22-3 14-14 20-26 20s-23-6-26-20c-2-10 2-18 8-22-2-10 4-18 18-18z" fill="url(#gb)" stroke="#2a1d3f" stroke-width="3.5"/>
    <circle cx="60" cy="80" r="8" fill="#2a1d3f"/><rect x="50" y="96" width="20" height="5" rx="2" fill="#2a1d3f"/>
    <path d="M44 66c2-5 6-8 11-9" stroke="#fff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/></g></svg>`,
  piano: `<svg viewBox="0 0 120 120"><rect x="12" y="30" width="96" height="62" rx="10" fill="#1f6f6a" stroke="#2a1d3f" stroke-width="3.5"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${19 + i * 14}" y="42" width="12" height="44" rx="3" fill="${i === 2 ? '#3ef0d0' : '#fff5ea'}" stroke="#2a1d3f" stroke-width="2"/>`).join('')}
    ${[0, 1, 3, 4].map(i => `<rect x="${28 + i * 14}" y="42" width="8" height="26" rx="2" fill="#2a1d3f"/>`).join('')}
    <circle cx="62" cy="22" r="6" fill="#3ef0d0"/><path d="M68 22V6l10 4" stroke="#3ef0d0" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  drums: `<svg viewBox="0 0 120 120"><ellipse cx="60" cy="88" rx="38" ry="12" fill="#000" opacity=".25"/>
    <path d="M24 52v28c0 8 16 14 36 14s36-6 36-14V52" fill="#e8a91f" stroke="#2a1d3f" stroke-width="3.5"/>
    ${[0, 1, 2, 3, 4].map(i => `<path d="M${30 + i * 15} ${60 + (i % 2) * 2}l6 26" stroke="#fff5ea" stroke-width="3" opacity=".7"/>`).join('')}
    <ellipse cx="60" cy="52" rx="36" ry="12" fill="#fff5ea" stroke="#2a1d3f" stroke-width="3.5"/>
    <path d="M30 10l34 40M92 12 58 48" stroke="#2a1d3f" stroke-width="6" stroke-linecap="round"/><path d="M30 10l34 40M92 12 58 48" stroke="#ffc94a" stroke-width="3" stroke-linecap="round"/></svg>`,
  theremin: `<svg viewBox="0 0 120 120"><path d="M10 64c8-30 16-30 24 0s16 30 24 0 16-30 24 0 16 30 24 0" fill="none" stroke="#b57cff" stroke-width="7" stroke-linecap="round"/>
    <path d="M10 64c8-30 16-30 24 0s16 30 24 0 16-30 24 0 16 30 24 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    <circle cx="92" cy="26" r="10" fill="#b57cff"/><circle cx="92" cy="26" r="18" fill="#b57cff" opacity=".25"/><circle cx="89" cy="23" r="3" fill="#fff"/></svg>`,
  challenge: `<svg viewBox="0 0 120 120"><path d="M38 20h44v22c0 16-10 26-22 26S38 58 38 42z" fill="#ff4f9a" stroke="#2a1d3f" stroke-width="3.5"/>
    <path d="M38 28H24c0 14 6 20 16 22M82 28h14c0 14-6 20-16 22" fill="none" stroke="#2a1d3f" stroke-width="3.5"/>
    <rect x="54" y="66" width="12" height="16" fill="#e23b80" stroke="#2a1d3f" stroke-width="3"/><rect x="40" y="82" width="40" height="12" rx="4" fill="#ff4f9a" stroke="#2a1d3f" stroke-width="3.5"/>
    <path d="M60 30l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#fff5ea"/></svg>`
};

export const HERO_ART = `<svg viewBox="0 0 360 260" class="hero-svg">
  <defs>
    <radialGradient id="sp" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#ff6a3d" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a3d" stop-opacity="0"/></radialGradient>
    <linearGradient id="gbody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb07a"/><stop offset=".5" stop-color="#ff6a3d"/><stop offset="1" stop-color="#c7361a"/></linearGradient>
    <filter id="gl"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <path d="M180 0 L60 260 L300 260 Z" fill="url(#sp)"/>
  <ellipse cx="180" cy="236" rx="120" ry="14" fill="#000" opacity=".35"/>
  <g class="air">${[0, 1, 2].map(i => `<path d="M${250 + i * 14} ${70 + i * 22} q18 18 0 36" fill="none" stroke="#3ef0d0" stroke-width="5" stroke-linecap="round" opacity="${0.9 - i * 0.25}"/>`).join('')}</g>
  <g transform="rotate(-28 180 140)">
    <rect x="172" y="10" width="16" height="118" rx="4" fill="#6b4426" stroke="#2a1d3f" stroke-width="5"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="172" y="${22 + i * 13}" width="16" height="2" fill="#d9c3a5"/>`).join('')}
    <path d="M164 -6h32l-4 22h-24z" fill="#2a1d3f"/>${[0, 1, 2].map(i => `<circle cx="160" cy="${-1 + i * 8}" r="3.5" fill="#ffc94a"/><circle cx="200" cy="${-1 + i * 8}" r="3.5" fill="#ffc94a"/>`).join('')}
    <path d="M180 112c28 0 40 14 36 32 12 8 20 24 16 42-6 28-28 40-52 40s-46-12-52-40c-4-18 4-34 16-42-4-18 8-32 36-32z" fill="url(#gbody)" stroke="#2a1d3f" stroke-width="6" stroke-linejoin="round"/>
    <path d="M150 140c4-10 12-16 22-18" stroke="#fff" stroke-width="6" fill="none" opacity=".5" stroke-linecap="round"/>
    <path d="M196 150c14 4 20 16 16 30l-14 26h-12z" fill="#2a1d3f" opacity=".9"/>
    <rect x="162" y="160" width="36" height="9" rx="3" fill="#fff5ea" stroke="#2a1d3f" stroke-width="3"/>
    <rect x="162" y="182" width="36" height="9" rx="3" fill="#fff5ea" stroke="#2a1d3f" stroke-width="3"/>
    <rect x="158" y="206" width="44" height="8" rx="3" fill="#2a1d3f"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${174 + i * 2.3}" y="16" width="1" height="194" fill="#fff" opacity=".8"/>`).join('')}
  </g>
  <g class="notes">
    <g transform="translate(72 70)"><circle r="9" fill="#ffc94a"/><path d="M9 0V-30l14 6" stroke="#ffc94a" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    <g transform="translate(300 40) scale(.8)"><circle r="9" fill="#ff4f9a"/><path d="M9 0V-30l14 6" stroke="#ff4f9a" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    <g transform="translate(46 170) scale(.7)"><circle r="9" fill="#3ef0d0"/><path d="M9 0V-30l14 6" stroke="#3ef0d0" stroke-width="5" fill="none" stroke-linecap="round"/></g>
  </g>
</svg>`;
