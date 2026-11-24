// Photos inside chats. On Android they are written as files in the app's data folder
// (keeps the saved JSON small); in a browser they stay as data URLs.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

const native = Capacitor.isNativePlatform();
let base = '';

export async function initMedia() {
  if (!native) return;
  try {
    await Filesystem.mkdir({ path: 'media', directory: Directory.Data, recursive: true }).catch(() => {});
    const r = await Filesystem.getUri({ path: 'media', directory: Directory.Data });
    base = r.uri.replace(/\/media\/?$/, '');
  } catch { /* ignore */ }
}

export function mediaUrl(ref) {
  if (!ref) return '';
  if (ref.startsWith('data:') || !native) return ref;
  return Capacitor.convertFileSrc(`${base}/${ref}`);
}

export async function putImage(dataUrl) {
  if (!native) return dataUrl;
  const name = `media/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.jpg`;
  await Filesystem.writeFile({ path: name, data: dataUrl.split(',')[1], directory: Directory.Data, recursive: true });
  return name;
}

export async function putMedia(dataUrl, ext = 'bin') {
  if (!native) return dataUrl;
  const name = `media/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.${ext}`;
  await Filesystem.writeFile({ path: name, data: dataUrl.split(',')[1], directory: Directory.Data, recursive: true });
  return name;
}
export const fileToRawDataUrl = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });

export async function readAsDataUrl(ref) {
  if (!ref || ref.startsWith('data:')) return ref;
  const r = await Filesystem.readFile({ path: ref, directory: Directory.Data });
  return 'data:image/jpeg;base64,' + r.data;
}

export async function fileToDataUrl(file, max = 900, square = false) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (square) {
      const m = Math.min(img.width, img.height);
      c.width = c.height = max;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, max, max);
      ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, max, max);
    } else {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
    }
    return c.toDataURL('image/jpeg', 0.84);
  } finally { URL.revokeObjectURL(url); }
}

export function pickFile(accept = 'image/*') {
  return new Promise(resolve => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept;
    inp.onchange = () => resolve(inp.files?.[0] || null);
    inp.click();
  });
}

export function pickFiles(accept = '*/*') {
  return new Promise(resolve => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept; inp.multiple = true;
    inp.onchange = () => resolve([...(inp.files || [])]);
    inp.click();
  });
}
