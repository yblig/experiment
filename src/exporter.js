// Turns a rendered <Shot> DOM node into a PNG and saves / shares it.
import { toPng, getFontEmbedCSS } from 'html-to-image';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const fontCache = new Map();

export async function renderPng(node, scale = 3, key = 'x') {
  if (!fontCache.has(key)) fontCache.set(key, await getFontEmbedCSS(node).catch(() => ''));
  const opts = { pixelRatio: scale, fontEmbedCSS: fontCache.get(key), width: node.offsetWidth, height: node.offsetHeight, cacheBust: false };
  // first call warms up images/fonts inside the WebView; the second is reliable
  await toPng(node, { ...opts, pixelRatio: 0.2 }).catch(() => {});
  return toPng(node, opts);
}

const safe = s => (s || 'chat').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'chat';

export function fileBase(title) {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${safe(title)}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

let permAsked = false;
async function ensurePerm() {
  if (permAsked) return;
  permAsked = true;
  try {
    const st = await Filesystem.checkPermissions();
    if (st.publicStorage !== 'granted') await Filesystem.requestPermissions();
  } catch { /* newer Android needs nothing */ }
}

// Saves into Pictures/ChatSim (shows up in the gallery); falls back to Documents/ChatSim.
export async function savePng(dataUrl, name, folder = '') {
  if (!Capacitor.isNativePlatform()) {
    const a = document.createElement('a');
    a.href = dataUrl; a.download = name + '.png'; a.click();
    return 'Gambar diunduh';
  }
  await ensurePerm();
  const data = dataUrl.split(',')[1];
  const sub = folder ? `/${folder}` : '';
  try {
    await Filesystem.writeFile({ path: `Pictures/ChatSim${sub}/${name}.png`, data, directory: Directory.ExternalStorage, recursive: true });
    return `Tersimpan di Galeri › Pictures/ChatSim${sub}`;
  } catch {
    await Filesystem.writeFile({ path: `ChatSim${sub}/${name}.png`, data, directory: Directory.Documents, recursive: true });
    return `Tersimpan di Documents/ChatSim${sub}`;
  }
}

export async function sharePngs(dataUrls, base) {
  if (!Capacitor.isNativePlatform()) {
    dataUrls.forEach((u, i) => savePng(u, dataUrls.length > 1 ? `${base}-${String(i + 1).padStart(2, '0')}` : base));
    return;
  }
  const files = [];
  for (let i = 0; i < dataUrls.length; i++) {
    const r = await Filesystem.writeFile({
      path: `share/${base}${dataUrls.length > 1 ? '-' + String(i + 1).padStart(2, '0') : ''}.png`,
      data: dataUrls[i].split(',')[1], directory: Directory.Cache, recursive: true
    });
    files.push(r.uri);
  }
  await Share.share({ files, title: 'ChatSim' });
}

// Writes a text file (backup JSON) and opens the share sheet / downloads it.
export async function shareTextFile(name, text, mime = 'application/json') {
  if (!Capacitor.isNativePlatform()) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name; a.click();
    return 'File diunduh';
  }
  let saved = '';
  try {
    await Filesystem.writeFile({ path: `ChatSim/${name}`, data: text, directory: Directory.Documents, recursive: true, encoding: 'utf8' });
    saved = 'Tersimpan di Documents/ChatSim';
  } catch { /* fall back to share only */ }
  const r = await Filesystem.writeFile({ path: `share/${name}`, data: text, directory: Directory.Cache, recursive: true, encoding: 'utf8' });
  await Share.share({ files: [r.uri], title: name }).catch(() => {});
  return saved || 'Cadangan siap dibagikan';
}

// Puts the phone screenshot on a 1080x1920 gradient canvas (for Reels/TikTok/Shorts).
export const FRAME_BGS = [
  ['#7c6cff', '#2fd6a3'], ['#ff7a59', '#ff2e93'], ['#0f2027', '#2c5364'], ['#fceabb', '#f8b500'], ['#111111', '#3a3a3a'], ['#a1ffce', '#faffd1']
];
export async function frame916(dataUrl, bgIdx = 0) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  const W = 1080, H = 1920, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const [a, b] = FRAME_BGS[bgIdx] || FRAME_BGS[0];
  const gr = ctx.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, a); gr.addColorStop(1, b);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  // soft light blobs
  for (const [x, y, r] of [[160, 260, 420], [940, 1620, 520]]) {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(255,255,255,.22)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }
  const maxW = W * 0.84, maxH = H * 0.86;
  const k = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * k, h = img.height * k, x = (W - w) / 2, y = (H - h) / 2, r = 46;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip(); ctx.drawImage(img, x, y, w, h); ctx.restore();
  return c.toDataURL('image/png');
}
