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
