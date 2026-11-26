// Receipt model → ESC/POS bytes (printer) and → canvas (preview / share image).
// One builder produces "blocks"; both outputs render the same blocks so what you
// see on screen is what comes out of the printer.
import QRCode from 'qrcode';
import { rp, fmtReceiptDate, fmtDateTime } from './format.js';
import { methodName } from '../store.js';

export const charsFor = paper => (paper === 80 ? 48 : 32);
export const dotsFor = paper => (paper === 80 ? 576 : 384);

// ---------- text helpers ----------
export function clean(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/•/g, '*')
    .replace(/[^\x20-\x7E\n]/g, '')
    .replace(/[ \t]+/g, ' ');
}
function wrap(text, w) {
  const out = [];
  for (const para of clean(text).split('\n')) {
    const words = para.trim().split(' ').filter(Boolean);
    if (!words.length) { out.push(''); continue; }
    let line = '';
    for (let word of words) {
      while (word.length > w) { if (line) { out.push(line); line = ''; } out.push(word.slice(0, w)); word = word.slice(w); }
      if (!word) continue;
      if (!line) line = word;
      else if ((line + ' ' + word).length <= w) line += ' ' + word;
      else { out.push(line); line = word; }
    }
    if (line) out.push(line);
  }
  return out;
}
function rowLines(left, right, w) {
  left = clean(left); right = clean(right);
  if (left.length + right.length + 1 <= w) return [left + ' '.repeat(w - left.length - right.length) + right];
  const ls = wrap(left, w);
  const last = ls[ls.length - 1];
  if (last.length + right.length + 1 <= w) { ls[ls.length - 1] = last + ' '.repeat(w - last.length - right.length) + right; return ls; }
  return [...ls, ' '.repeat(Math.max(0, w - right.length)) + right];
}

// ---------- block builder ----------
function B(w) {
  const blocks = [];
  const api = {
    blocks,
    text(t, o = {}) {
      const big = !!o.big; const cw = big ? Math.floor(w / 2) : w;
      wrap(t, cw).forEach(l => blocks.push({ t: 'line', text: l, align: o.align || 'l', bold: !!o.bold, big, tall: !!o.tall }));
      return api;
    },
    row(l, r, o = {}) {
      const cw = o.tall ? w : w;
      rowLines(l, r, cw).forEach(x => blocks.push({ t: 'line', text: x, align: 'l', bold: !!o.bold, tall: !!o.tall }));
      return api;
    },
    hr(ch = '-') { blocks.push({ t: 'line', text: ch.repeat(w), align: 'l' }); return api; },
    blank() { blocks.push({ t: 'line', text: '', align: 'l' }); return api; },
    logo() { blocks.push({ t: 'logo' }); return api; },
    qr(data) { blocks.push({ t: 'qr', data }); return api; }
  };
  return api;
}

function storeHead(b, s, hasLogo) {
  if (s.showLogo && hasLogo) b.logo();
  if (s.storeName) b.text(s.storeName, { align: 'c', big: true, bold: true });
  if (s.address) b.text(s.address, { align: 'c' });
  if (s.phone) b.text('Telp/WA ' + s.phone, { align: 'c' });
  if (s.header) b.text(s.header, { align: 'c' });
}

export function buildSaleReceipt(sale, s, { hasLogo = false, copy = '' } = {}) {
  const w = charsFor(s.paper);
  const b = B(w);
  storeHead(b, s, hasLogo);
  b.hr('=');
  if (copy) b.text(copy, { align: 'c', bold: true });
  b.row('No', sale.no);
  b.row('Tanggal', fmtReceiptDate(sale.date));
  if (s.showCashier && (sale.cashier || s.cashier)) b.row('Kasir', sale.cashier || s.cashier);
  if (s.showCustomer && sale.customer) b.row('Pelanggan', sale.customer);
  b.hr();
  for (const it of sale.items) {
    b.text(it.name, { bold: false });
    b.row(`  ${it.qty} x ${rp(it.price, false)}`, rp(it.price * it.qty, false));
    if (it.disc) b.row('  Diskon', '-' + rp(it.disc, false));
  }
  b.hr();
  b.row(`Subtotal (${sale.qty} item)`, rp(sale.subtotal, false));
  if (sale.discount) b.row('Diskon' + (sale.discLabel ? ` ${sale.discLabel}` : ''), '-' + rp(sale.discount, false));
  if (sale.service) b.row(`Layanan ${sale.servicePct}%`, rp(sale.service, false));
  if (sale.tax) b.row(`Pajak ${sale.taxPct}%`, rp(sale.tax, false));
  b.row('TOTAL', rp(sale.total), { bold: true, tall: true });
  if (sale.method === 'debt') {
    const paid = (sale.payments || []).reduce((a, p) => a + p.amount, 0);
    if (paid) b.row('Sudah dibayar', rp(paid, false));
    if (sale.status === 'debt') { b.row('SISA (KASBON)', rp(sale.total - paid), { bold: true }); }
    else b.text('*** LUNAS ***', { align: 'c', bold: true });
  } else {
    b.row(`Bayar (${methodName(sale.method)})`, rp(sale.paid, false));
    if (sale.method === 'cash') b.row('Kembali', rp(sale.change, false));
  }
  if (sale.status === 'void') { b.blank(); b.text('*** TRANSAKSI DIBATALKAN ***', { align: 'c', bold: true }); }
  if (sale.note) { b.hr(); b.text('Catatan: ' + sale.note); }
  b.hr('=');
  if (s.footer) b.text(s.footer, { align: 'c' });
  if (s.showQr && s.qrText) { b.blank(); b.qr(s.qrText); if (s.qrLabel) b.text(s.qrLabel, { align: 'c' }); }
  return b.blocks;
}

export function buildReportReceipt(rep, s, { hasLogo = false } = {}) {
  const w = charsFor(s.paper);
  const b = B(w);
  if (s.storeName) b.text(s.storeName, { align: 'c', big: true, bold: true });
  b.text('LAPORAN ' + rep.label.toUpperCase(), { align: 'c', bold: true });
  b.text('Dicetak ' + fmtDateTime(Date.now()), { align: 'c' });
  b.hr('=');
  b.row('Jumlah transaksi', String(rep.count));
  b.row('Barang terjual', String(rep.qty));
  b.row('Penjualan (omzet)', rp(rep.omzet, false));
  b.row('Modal barang', '-' + rp(rep.cost, false));
  b.row('Laba kotor', rp(rep.gross, false), { bold: true });
  b.row('Pemasukan lain', rp(rep.otherIn, false));
  b.row('Pengeluaran', '-' + rp(rep.out, false));
  b.hr();
  b.row('LABA BERSIH', rp(rep.net), { bold: true, tall: true });
  b.hr();
  b.text('Per metode bayar', { bold: true });
  rep.methods.forEach(m => b.row('  ' + m.name, rp(m.amount, false)));
  if (rep.debtOpen) b.row('  Kasbon belum lunas', rp(rep.debtOpen, false));
  if (rep.top.length) {
    b.hr();
    b.text('Produk terlaris', { bold: true });
    rep.top.slice(0, 10).forEach((p, i) => b.row(`${i + 1}. ${p.name}`, `${p.qty}x`));
  }
  if (rep.outCats.length) {
    b.hr();
    b.text('Rincian pengeluaran', { bold: true });
    rep.outCats.forEach(c => b.row('  ' + c.name, rp(c.amount, false)));
  }
  if (rep.voids) { b.hr(); b.row('Transaksi dibatalkan', String(rep.voids)); }
  b.hr('=');
  b.text('Tanda tangan', { align: 'c' });
  b.blank(); b.blank();
  b.text('(........................)', { align: 'c' });
  return b.blocks;
}

export function buildTestReceipt(s, { hasLogo = false } = {}) {
  const w = charsFor(s.paper);
  const b = B(w);
  storeHead(b, s, hasLogo);
  b.hr('=');
  b.text('TES PRINTER BERHASIL', { align: 'c', bold: true, tall: true });
  b.text(`Kertas ${s.paper} mm - ${w} karakter`, { align: 'c' });
  b.text(fmtDateTime(Date.now()), { align: 'c' });
  b.hr();
  b.text('Teks biasa abcdefghijklmnopqrstuvwxyz');
  b.text('TEBAL ABCDEFGHIJKLMNOPQRSTUVWXYZ', { bold: true });
  b.text('BESAR', { big: true, bold: true, align: 'c' });
  b.row('Kiri', 'Kanan');
  b.text('1234567890'.repeat(Math.ceil(w / 10)).slice(0, w));
  b.hr('=');
  if (s.footer) b.text(s.footer, { align: 'c' });
  if (s.showQr && s.qrText) { b.blank(); b.qr(s.qrText); }
  return b.blocks;
}

// ---------- monochrome bitmaps ----------
function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

// Atkinson dithering → { w, h, bits: Uint8Array(w*h) 1 = black }
export async function logoBitmap(dataUrl, paper, pct = 60) {
  const img = await loadImage(dataUrl);
  const maxW = dotsFor(paper);
  let w = Math.round(maxW * Math.min(100, Math.max(20, pct)) / 100 / 8) * 8;
  let h = Math.round(img.height * (w / img.width));
  const maxH = paper === 80 ? 300 : 220;
  if (h > maxH) { w = Math.max(8, Math.round(img.width * (maxH / img.height) / 8) * 8); h = maxH; }
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
  const bits = new Uint8Array(w * h);
  const push = (xx, yy, e) => { if (xx >= 0 && xx < w && yy < h) g[yy * w + xx] += e; };
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const i = y * w + xx; const o = g[i]; const n = o < 128 ? 0 : 255; bits[i] = n === 0 ? 1 : 0;
    const e = (o - n) / 8;
    push(xx + 1, y, e); push(xx + 2, y, e); push(xx - 1, y + 1, e); push(xx, y + 1, e); push(xx + 1, y + 1, e); push(xx, y + 2, e);
  }
  return { w, h, bits };
}

export function qrBitmap(text, paper) {
  const q = QRCode.create(clean(text) || ' ', { errorCorrectionLevel: 'M' });
  const n = q.modules.size; const quiet = 2;
  const target = paper === 80 ? 260 : 200;
  const scale = Math.max(2, Math.floor(target / (n + quiet * 2)));
  const size = (n + quiet * 2) * scale;
  const w = Math.ceil(size / 8) * 8, h = size;
  const bits = new Uint8Array(w * h);
  const off = Math.floor((w - size) / 2);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!q.modules.get(r, c)) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) bits[((r + quiet) * scale + dy) * w + off + (c + quiet) * scale + dx] = 1;
  }
  return { w, h, bits };
}

export async function prepareImages(blocks, s, logo) {
  const out = {};
  if (logo && blocks.some(b => b.t === 'logo')) { try { out.logo = await logoBitmap(logo, s.paper, s.logoWidth); } catch { /* bad image */ } }
  const q = blocks.find(b => b.t === 'qr');
  if (q) { try { out.qr = qrBitmap(q.data, s.paper); } catch { /* too long */ } }
  return out;
}

// ---------- ESC/POS ----------
export function encodeEscPos(blocks, imgs, s) {
  const bytes = [];
  const push = (...a) => { for (const v of a) bytes.push(v); };
  const str = t => { for (let i = 0; i < t.length; i++) bytes.push(t.charCodeAt(i) & 0x7f); };
  const dots = dotsFor(s.paper);
  const raster = bm => {
    // centre by padding to full paper width
    const totalW = Math.min(dots, Math.ceil(bm.w / 8) * 8);
    const pad = Math.floor((dots - totalW) / 2 / 8) * 8;
    const W = pad + totalW; const wb = W / 8;
    push(0x1b, 0x61, 0x00);
    const band = 96;
    for (let y0 = 0; y0 < bm.h; y0 += band) {
      const hh = Math.min(band, bm.h - y0);
      push(0x1d, 0x76, 0x30, 0x00, wb & 0xff, (wb >> 8) & 0xff, hh & 0xff, (hh >> 8) & 0xff);
      for (let y = 0; y < hh; y++) {
        for (let xb = 0; xb < wb; xb++) {
          let v = 0;
          for (let bit = 0; bit < 8; bit++) {
            const x = xb * 8 + bit - pad;
            if (x >= 0 && x < bm.w && bm.bits[(y0 + y) * bm.w + x]) v |= 0x80 >> bit;
          }
          bytes.push(v);
        }
      }
    }
  };
  push(0x1b, 0x40);          // init
  push(0x1b, 0x74, 0x00);    // code page PC437
  push(0x1b, 0x32);          // default line spacing
  for (const b of blocks) {
    if (b.t === 'logo') { if (imgs.logo) { raster(imgs.logo); push(0x0a); } continue; }
    if (b.t === 'qr') { if (imgs.qr) { raster(imgs.qr); } continue; }
    push(0x1b, 0x61, b.align === 'c' ? 1 : b.align === 'r' ? 2 : 0);
    push(0x1b, 0x45, b.bold ? 1 : 0);
    push(0x1d, 0x21, b.big ? 0x11 : b.tall ? 0x01 : 0x00);
    str(b.text); push(0x0a);
  }
  push(0x1d, 0x21, 0x00, 0x1b, 0x45, 0x00, 0x1b, 0x61, 0x00);
  push(0x1b, 0x64, Math.max(1, Math.min(8, s.feedLines ?? 3)));
  if (s.paper === 80 && s.autoCut) push(0x1d, 0x56, 0x42, 0x00);
  return new Uint8Array(bytes);
}

// ---------- canvas preview ----------
let fontReady = null;
export function ensureMonoFont() {
  if (!fontReady) fontReady = Promise.all([document.fonts.load('400 20px "JetBrains Mono"'), document.fonts.load('800 20px "JetBrains Mono"')]).catch(() => {});
  return fontReady;
}

export async function renderReceiptCanvas(blocks, imgs, s, scale = 2) {
  await ensureMonoFont();
  const dots = dotsFor(s.paper); const w = charsFor(s.paper);
  const padX = 14, padY = 22;
  const cw = dots / w;                 // dots per char
  const fs = cw / 0.6;                  // mono advance ≈ 0.6em
  const lh = Math.round(fs * 1.25);
  let H = padY * 2;
  for (const b of blocks) {
    if (b.t === 'logo') H += imgs.logo ? imgs.logo.h + 8 : 0;
    else if (b.t === 'qr') H += imgs.qr ? imgs.qr.h + 4 : 0;
    else H += b.big ? lh * 2 : b.tall ? lh * 2 : lh;
  }
  const W = dots + padX * 2;
  const c = document.createElement('canvas'); c.width = W * scale; c.height = H * scale;
  const x = c.getContext('2d'); x.scale(scale, scale);
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#141414'; x.textBaseline = 'middle';
  const drawBits = (bm, y) => {
    const ox = padX + Math.floor((dots - bm.w) / 2);
    for (let yy = 0; yy < bm.h; yy++) {
      let run = -1;
      for (let xx = 0; xx <= bm.w; xx++) {
        const on = xx < bm.w && bm.bits[yy * bm.w + xx];
        if (on && run < 0) run = xx;
        if (!on && run >= 0) { x.fillRect(ox + run, y + yy, xx - run, 1); run = -1; }
      }
    }
  };
  let y = padY;
  for (const b of blocks) {
    if (b.t === 'logo') { if (imgs.logo) { drawBits(imgs.logo, y); y += imgs.logo.h + 8; } continue; }
    if (b.t === 'qr') { if (imgs.qr) { drawBits(imgs.qr, y); y += imgs.qr.h + 4; } continue; }
    const big = b.big, tall = b.tall;
    const h = big || tall ? lh * 2 : lh;
    x.save();
    const sx = big ? 2 : 1, sy = big || tall ? 2 : 1;
    x.font = `${b.bold ? 800 : 500} ${fs}px "JetBrains Mono", monospace`;
    const textW = b.text.length * cw * sx;
    let tx = padX;
    if (b.align === 'c') tx = padX + (dots - textW) / 2; else if (b.align === 'r') tx = padX + dots - textW;
    x.translate(tx, y + h / 2); x.scale(sx, sy);
    for (let i = 0; i < b.text.length; i++) x.fillText(b.text[i], i * cw + (cw - x.measureText(b.text[i]).width) / 2, 0);
    x.restore();
    y += h;
  }
  return c;
}
