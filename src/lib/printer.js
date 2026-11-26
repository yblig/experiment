// Bluetooth thermal printer service. Uses the native BtPrinter plugin on Android
// (classic Bluetooth SPP) and a demo printer in the browser.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { create } from 'zustand';
import { useStore } from '../store.js';
import { encodeEscPos, prepareImages, renderReceiptCanvas } from './receipt.js';

const Bt = registerPlugin('BtPrinter');
export const isNative = Capacitor.isNativePlatform();

export const usePrinter = create(() => ({ state: 'idle', name: null, address: null, error: null, busy: false }));
const setP = patch => usePrinter.setState(patch);

const demo = { connected: false, address: null, name: null };
const wait = ms => new Promise(r => setTimeout(r, ms));

function b64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function errText(e) {
  const code = e?.code; const msg = e?.message || String(e);
  if (code === 'OFF') return 'Bluetooth masih mati. Nyalakan dulu Bluetooth HP.';
  if (code === 'DENIED') return 'Izin Bluetooth belum diberikan. Izinkan "Perangkat di sekitar" untuk StrukKu.';
  if (code === 'UNSUPPORTED') return 'HP ini tidak punya Bluetooth.';
  if (code === 'NOT_CONNECTED') return 'Printer belum tersambung.';
  return msg;
}

export async function status() {
  if (!isNative) return { supported: true, enabled: true, granted: true, connected: demo.connected, address: demo.address, name: demo.name };
  return Bt.status();
}
export async function requestAccess() { if (!isNative) return { granted: true }; return Bt.requestAccess(); }
export async function enableBluetooth() { if (isNative) await Bt.enable(); }
export async function openBtSettings() { if (isNative) await Bt.openSettings(); }

export async function listDevices() {
  if (!isNative) { await wait(500); return [{ name: 'RPP02N (Demo)', address: 'DE:M0:00:00:00:58', printer: true }, { name: 'Printer-80 (Demo)', address: 'DE:M0:00:00:00:80', printer: true }, { name: 'Headset Bluetooth', address: 'AA:BB:CC:DD:EE:FF', printer: false }]; }
  const r = await Bt.listPaired();
  return (r.devices || []).sort((a, b) => (b.printer ? 1 : 0) - (a.printer ? 1 : 0));
}

export async function connect(address, name) {
  setP({ state: 'connecting', error: null, address, name });
  try {
    if (!isNative) { await wait(900); Object.assign(demo, { connected: true, address, name }); }
    else { const r = await Bt.connect({ address }); name = r.name || name; }
    setP({ state: 'connected', name, address, error: null });
    useStore.getState().setSettings({ printerAddress: address, printerName: name });
    return true;
  } catch (e) {
    setP({ state: 'error', error: errText(e) });
    throw e;
  }
}
export async function disconnect() {
  if (!isNative) demo.connected = false; else await Bt.disconnect().catch(() => {});
  setP({ state: 'idle' });
}
export async function forget() {
  await disconnect();
  useStore.getState().setSettings({ printerAddress: null, printerName: null });
  setP({ name: null, address: null });
}

export async function autoConnect() {
  const s = useStore.getState().settings;
  if (!s.autoConnect || !s.printerAddress) return;
  try {
    const st = await status();
    if (st.connected) { setP({ state: 'connected', name: st.name || s.printerName, address: st.address }); return; }
    if (!st.enabled || !st.granted) return;
    await connect(s.printerAddress, s.printerName);
  } catch { setP({ state: 'idle', error: null }); }
}

async function ensureConnected() {
  const s = useStore.getState().settings;
  const st = await status().catch(() => ({}));
  if (st.connected) return;
  if (!s.printerAddress) { const e = new Error('Belum ada printer. Pilih printer di menu Printer Bluetooth.'); e.code = 'NO_PRINTER'; throw e; }
  if (st.enabled === false) { const e = new Error('Bluetooth mati'); e.code = 'OFF'; throw e; }
  await connect(s.printerAddress, s.printerName);
}

async function writeBytes(bytes) {
  if (!isNative) { await wait(700 + bytes.length / 40); console.log('[demo printer] bytes', bytes.length); return; }
  await Bt.write({ data: b64(bytes), chunk: 512, delay: 25 });
}

/** Print blocks. copies → repeated. Throws a friendly Error on failure. */
export async function printBlocks(blocks, { copies = 1, name = 'struk' } = {}) {
  const st = useStore.getState();
  if (!isNative) {
    // Web (iPhone/iPad): no Bluetooth in Safari → AirPrint / share the receipt as an image.
    const imgs = await prepareImages(blocks, st.settings, st.logo);
    const canvas = await renderReceiptCanvas(blocks, imgs, st.settings, 2);
    usePrinter.setState({ webJob: { url: canvas.toDataURL('image/png'), canvas, name } });
    return 'web';
  }
  setP({ busy: true });
  try {
    await ensureConnected();
    const imgs = await prepareImages(blocks, st.settings, st.logo);
    const bytes = encodeEscPos(blocks, imgs, st.settings);
    for (let i = 0; i < Math.max(1, copies); i++) {
      try { await writeBytes(bytes); }
      catch (e) {
        // connection dropped (printer slept) → reconnect once and retry
        if (i === 0 && isNative) { setP({ state: 'idle' }); await connect(st.settings.printerAddress, st.settings.printerName); await writeBytes(bytes); }
        else throw e;
      }
      if (i < copies - 1) await wait(900);
    }
  } catch (e) {
    const err = new Error(e.code === 'NO_PRINTER' ? e.message : errText(e)); err.code = e.code || 'PRINT';
    throw err;
  } finally { setP({ busy: false }); }
}
