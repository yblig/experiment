// Navigation, toasts, dialogs and PIN prompts.
import { create } from 'zustand';
import { useStore } from './store.js';
import { fx } from './lib/fx.js';

let tid = 0;
export const useUI = create((set, get) => ({
  tab: 'home',
  stack: [],
  toasts: [],
  dialog: null,
  pinReq: null,
  unlocked: false,
  unlockedAt: 0,

  setTab(tab) { if (get().tab !== tab) fx('tap'); set({ tab, stack: [] }); },
  push(name, props = {}) { fx('whoosh', { volume: 0.5 }); set(st => ({ stack: [...st.stack, { id: ++tid, name, props }] })); },
  pop() { set(st => ({ stack: st.stack.slice(0, -1) })); },
  replace(name, props = {}) { set(st => ({ stack: [...st.stack.slice(0, -1), { id: ++tid, name, props }] })); },
  popToRoot() { set({ stack: [] }); },

  toast(msg, opts = {}) {
    const id = ++tid;
    set(st => ({ toasts: [...st.toasts.slice(-1), { id, msg, ...opts }] }));
    setTimeout(() => set(st => ({ toasts: st.toasts.filter(t => t.id !== id) })), opts.duration || (opts.action ? 4500 : 2600));
  },
  dismissToast(id) { set(st => ({ toasts: st.toasts.filter(t => t.id !== id) })); },

  confirm(o) { return new Promise(resolve => set({ dialog: { ...o, resolve } })); },
  closeDialog(v) { const d = get().dialog; set({ dialog: null }); d?.resolve(v); },

  lock() { set({ unlocked: false }); },
  requirePin(area, title) {
    const s = useStore.getState().settings;
    if (!s.pin) return Promise.resolve(true);
    if (area && !s.lock[area]) return Promise.resolve(true);
    const st = get();
    if (st.unlocked && Date.now() - st.unlockedAt < 10 * 60 * 1000) return Promise.resolve(true);
    return new Promise(resolve => set({ pinReq: { title: title || 'Masukkan PIN', resolve } }));
  },
  finishPin(ok) {
    const r = get().pinReq;
    set({ pinReq: null, ...(ok ? { unlocked: true, unlockedAt: Date.now() } : {}) });
    r?.resolve(ok);
  }
}));

export const toast = (m, o) => useUI.getState().toast(m, o);
export const confirmDialog = o => useUI.getState().confirm(o);
export const nav = {
  push: (n, p) => useUI.getState().push(n, p),
  pop: () => useUI.getState().pop(),
  replace: (n, p) => useUI.getState().replace(n, p),
  tab: t => useUI.getState().setTab(t),
  root: () => useUI.getState().popToRoot()
};
