import { create } from 'zustand';
import { storage } from './lib/storage.js';
import { presetToChat } from './presets.js';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const nowClock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const TEMPLATES = {
  imessage: { label: 'iMessage', color: '#0a84ff', note: 'Gelembung biru/hijau' },
  whatsapp: { label: 'WhatsApp', color: '#25d366', note: 'Centang & wallpaper' },
  x: { label: 'X / Twitter', color: '#1d9bf0', note: 'DM gaya X' }
};

export function blankChat(template = 'imessage') {
  const clock = nowClock();
  return {
    id: uid(),
    title: 'Chat baru',
    template,
    dark: true,
    contact: { name: 'Unknown', avatar: null, status: 'online', handle: '@unknown', unread: '3' },
    meColor: '#0a84ff',
    clock,
    battery: 76,
    showStatusBar: true,
    showInput: true,
    frame: 'phone',
    messages: [],
    updatedAt: Date.now()
  };
}

const defaults = { theme: 'system', sound: true, haptics: true, defaultTemplate: 'imessage', exportScale: 3 };

export const useStore = create((set, get) => ({
  chats: [],
  settings: defaults,
  load() {
    const saved = storage.get('chats', null);
    const chats = Array.isArray(saved?.items) ? saved.items : [];
    set({ chats, settings: { ...defaults, ...storage.get('settings', {}) } });
  },
  setSettings(patch) {
    const settings = { ...get().settings, ...patch };
    storage.set('settings', settings);
    set({ settings });
  },
  addChat(chat) {
    set({ chats: [chat, ...get().chats] });
    persist();
    return chat.id;
  },
  newChat(template) {
    return get().addChat(blankChat(template || get().settings.defaultTemplate));
  },
  fromPreset(p) {
    const c = { ...blankChat(p.template), ...presetToChat(p, uid), id: uid(), updatedAt: Date.now() };
    return get().addChat(c);
  },
  updateChat(id, fn) {
    set({
      chats: get().chats.map(c => (c.id === id ? { ...fn(c), updatedAt: Date.now() } : c))
    });
    persist();
  },
  deleteChat(id) {
    set({ chats: get().chats.filter(c => c.id !== id) });
    persist();
  },
  duplicateChat(id) {
    const c = get().chats.find(x => x.id === id);
    if (!c) return;
    const copy = { ...structuredClone(c), id: uid(), title: c.title + ' (salinan)', updatedAt: Date.now() };
    set({ chats: [copy, ...get().chats] });
    persist();
  },
  restoreChat(chat) {
    set({ chats: [chat, ...get().chats].sort((a, b) => b.updatedAt - a.updatedAt) });
    persist();
  },
  clearAll() {
    set({ chats: [] });
    persist();
  }
}));

let timer = 0;
function persist() {
  clearTimeout(timer);
  timer = setTimeout(() => storage.set('chats', { v: 1, items: useStore.getState().chats }), 250);
}
