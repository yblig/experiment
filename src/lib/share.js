// Save/share files (CSV, backup JSON, receipt image) via the Android share sheet.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const native = Capacitor.isNativePlatform();

export async function shareFile(name, data, { base64 = false, mime = 'text/plain', title = 'Bagikan', text = '' } = {}) {
  if (native) {
    const r = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache, ...(base64 ? {} : { encoding: Encoding.UTF8 }), recursive: true });
    await Share.share({ title, text: text || undefined, files: [r.uri], dialogTitle: title });
    return;
  }
  const blob = base64 ? new Blob([Uint8Array.from(atob(data), c => c.charCodeAt(0))], { type: mime }) : new Blob([data], { type: mime });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function shareCanvas(canvas, name, text) {
  const b64 = canvas.toDataURL('image/png').split(',')[1];
  return shareFile(name, b64, { base64: true, mime: 'image/png', title: 'Bagikan struk', text });
}

export function pickFile(accept) {
  return new Promise(resolve => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept;
    i.onchange = () => resolve(i.files?.[0] || null);
    i.click();
  });
}
export const readText = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(f); });
export const readDataUrl = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });

export function toCsv(rows) {
  return '﻿' + rows.map(r => r.map(v => {
    const s = String(v ?? '');
    return /[;"\n,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(';')).join('\r\n');
}

// Downscale an image file to a reasonable logo size (keeps transparency as white).
export async function resizeImage(dataUrl, maxW = 600) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  const s = Math.min(1, maxW / img.width);
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}
