// Bridge to the native ScreenFix plugin (Java). In a browser a mock stands in so
// the UI can be previewed; window.__mock lets preview steps change its state.
import { Capacitor, registerPlugin } from '@capacitor/core';

function createMock() {
  const listeners = {};
  const s = {
    physicalWidth: 1080, physicalHeight: 2400, logicalWidth: 1080, logicalHeight: 2400,
    strip: 0, mode: 'off', shrinkActive: false, appliedStrip: 0, overlayRunning: false,
    canDrawOverlays: false, overlayOnBoot: true, shizukuInstalled: false, shizukuRunning: false,
    shizukuGranted: false, shizukuOld: false, shizukuDenied: false, revertPending: false,
    sdk: 34, release: '14', manufacturer: 'OPPO', model: 'Preview'
  };
  const emit = (ev, data) => (listeners[ev] || []).forEach(f => f(data));
  const snap = () => ({ ...s });
  const wait = (ms = 220) => new Promise(r => setTimeout(r, ms));
  let revert = null;
  const api = {
    async getState() { return snap(); },
    async setStrip({ strip }) { s.strip = strip; return snap(); },
    async setOverlayOnBoot({ value }) { s.overlayOnBoot = value; return snap(); },
    async requestShizuku() { await wait(); s.shizukuGranted = true; emit('shizukuChanged', {}); return { granted: true }; },
    async openShizuku() { if (!s.shizukuInstalled) s.shizukuInstalled = true; else s.shizukuRunning = true; emit('shizukuChanged', {}); },
    async openUrl({ url }) { window.open(url, '_blank'); },
    async openDeveloperSettings() {},
    async applyShrink({ strip, timeout = 0, setMode = true }) {
      await wait(400);
      if (!s.shizukuGranted) throw new Error('Shizuku belum aktif atau belum diberi izin');
      s.strip = strip; s.shrinkActive = true; s.appliedStrip = strip; s.overlayRunning = false;
      if (setMode) s.mode = 'shrink';
      clearTimeout(revert);
      if (timeout) revert = setTimeout(() => { s.shrinkActive = false; s.mode = 'off'; emit('shrinkReverted', snap()); }, timeout * 1000);
      return snap();
    },
    async confirmShrink() { clearTimeout(revert); return snap(); },
    async resetShrink({ keepMode } = {}) { clearTimeout(revert); await wait(300); s.shrinkActive = false; if (!keepMode) s.mode = 'off'; return snap(); },
    async requestOverlayPermission() { await wait(); s.canDrawOverlays = true; return snap(); },
    async startOverlay({ strip }) { s.strip = strip; s.overlayRunning = true; s.mode = 'overlay'; s.shrinkActive = false; return snap(); },
    async stopOverlay() { s.overlayRunning = false; if (s.mode === 'overlay') s.mode = 'off'; return snap(); },
    async addListener(ev, fn) { (listeners[ev] ||= []).push(fn); return { remove: () => { listeners[ev] = listeners[ev].filter(f => f !== fn); } }; }
  };
  window.__mock = { state: s, emit, set(p) { Object.assign(s, p); emit('shizukuChanged', {}); } };
  return api;
}

export const isNative = Capacitor.isNativePlatform();
export const ScreenFix = isNative ? registerPlugin('ScreenFix') : createMock();

/** Converts a CSS x position (in the full-screen calibration view) to physical px. */
export function cssToPhysical(cssX, st, viewWidth) {
  const lx = cssX * (st.logicalWidth / viewWidth);
  const scale = st.physicalHeight / st.logicalHeight;
  const offset = (st.physicalWidth - st.logicalWidth * scale) / 2;
  return offset + lx * scale;
}
export function physicalToCss(px, st, viewWidth) {
  const scale = st.physicalHeight / st.logicalHeight;
  const offset = (st.physicalWidth - st.logicalWidth * scale) / 2;
  return ((px - offset) / scale) * (viewWidth / st.logicalWidth);
}
