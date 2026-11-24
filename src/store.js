import { create } from 'zustand';
import { storage } from './lib/storage.js';
import { presetToChat } from './presets.js';
import { putImage, readAsDataUrl } from './media.js';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const nowClock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const addMinutes = (t, n) => {
  const [h, m] = (t || '00:00').split(':').map(Number);
  const x = (((h * 60 + m + n) % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
};

export const TEMPLATES = {
  snapchat: { label: 'Snapchat', color: '#f5c400', note: 'Tanpa gelembung' },
  line: { label: 'LINE', color: '#06c755', note: 'Jam di samping' },
  x: { label: 'X / Twitter', color: '#1d9bf0', note: 'DM gaya X' },
  imessage: { label: 'iMessage', color: '#0a84ff', note: 'Gelembung biru/hijau' },
  telegram: { label: 'Telegram', color: '#2aabee', note: 'Wallpaper gradasi' },
  tinder: { label: 'Tinder', color: '#fd5068', note: 'Chat match' },
  instagram: { label: 'Instagram', color: '#e1306c', note: 'DM gaya IG' },
  messenger: { label: 'Messenger', color: '#0a7cff', note: 'Gradasi biru-ungu' },
  whatsapp: { label: 'WhatsApp', color: '#25d366', note: 'Android / iPhone' },
  kakao: { label: 'KakaoTalk', color: '#e6c800', note: 'Gelembung kuning' },
  sms: { label: 'SMS Android', color: '#4c8df6', note: 'Gaya Material' },
  lock: { label: 'Layar Kunci', color: '#ff9f0a', note: 'Notifikasi di lock screen' }
};

export const PCOLORS = ['#ff6b6b', '#ffa94d', '#20c997', '#4dabf7', '#b197fc', '#f783ac', '#51cf66', '#fcc419'];

const DEFAULTS = {
  title: 'Chat baru', dark: true, meColor: '#0a84ff', battery: 76, showStatusBar: true, showInput: true, frame: 'phone',
  group: false, participants: [], wallpaper: { type: 'default', value: '' }, verified: false, textScale: 1,
  watermark: '', charging: false, autoTime: false, pinned: false,
  notif: { on: false, from: '', text: '', when: 'sekarang', color: '#34c759' }, keyboard: false, draft: '', pinnedText: '', lockApp: 'Pesan', lockColor: '#34c759',
  waStyle: 'android', lang: 'auto', textStyle: 'normal', bubble: 'original', statusDefault: false, sbStyle: 'auto'
};

export function normalize(c) {
  const contact = { name: 'Unknown', avatar: null, status: 'online', handle: '@unknown', unread: '3', ...(c.contact || {}) };
  return { ...DEFAULTS, ...c, contact, wallpaper: { ...DEFAULTS.wallpaper, ...(c.wallpaper || {}) }, notif: { ...DEFAULTS.notif, ...(c.notif || {}) }, messages: c.messages || [] };
}

export function blankChat(template = 'imessage') {
  return normalize({ id: uid(), template, clock: nowClock(), waStyle: 'ios', messages: [], updatedAt: Date.now() });
}

const defaults = { lang: 'id', theme: 'system', sound: true, haptics: true, defaultTemplate: 'imessage', exportScale: 3, frameBg: 0 };

// --- undo / redo (per chat, in memory) ---
const hist = new Map();
const H = id => { if (!hist.has(id)) hist.set(id, { past: [], future: [], t: 0 }); return hist.get(id); };

export const useStore = create((set, get) => ({
  chats: [],
  myPresets: [],
  settings: defaults,
  histTick: 0,
  load() {
    const saved = storage.get('chats', null);
    const chats = Array.isArray(saved?.items) ? saved.items.map(normalize) : [];
    set({ chats, myPresets: storage.get('myPresets', []), settings: { ...defaults, ...storage.get('settings', {}) } });
  },
  setSettings(patch) {
    const settings = { ...get().settings, ...patch };
    storage.set('settings', settings);
    set({ settings });
  },
  addChat(chat) {
    set({ chats: [normalize(chat), ...get().chats] });
    persist();
    return chat.id;
  },
  newChat(template) {
    return get().addChat(blankChat(template || get().settings.defaultTemplate));
  },
  fromPreset(p) {
    const c = normalize({ ...blankChat(p.template), ...presetToChat(p, uid), id: uid(), updatedAt: Date.now() });
    return get().addChat(c);
  },
  updateChat(id, fn, record = true) {
    const cur = get().chats.find(c => c.id === id);
    if (!cur) return;
    if (record) {
      const h = H(id), now = Date.now();
      if (now - h.t > 700) { h.past.push(cur); if (h.past.length > 80) h.past.shift(); }
      h.t = now; h.future = [];
    }
    set({ chats: get().chats.map(c => (c.id === id ? { ...fn(c), updatedAt: Date.now() } : c)), histTick: get().histTick + 1 });
    persist();
  },
  canUndo: id => (hist.get(id)?.past.length || 0) > 0,
  canRedo: id => (hist.get(id)?.future.length || 0) > 0,
  undo(id) {
    const h = H(id), cur = get().chats.find(c => c.id === id);
    if (!h.past.length || !cur) return false;
    h.future.push(cur); h.t = 0;
    const prev = h.past.pop();
    set({ chats: get().chats.map(c => (c.id === id ? prev : c)), histTick: get().histTick + 1 });
    persist();
    return true;
  },
  redo(id) {
    const h = H(id), cur = get().chats.find(c => c.id === id);
    if (!h.future.length || !cur) return false;
    h.past.push(cur); h.t = 0;
    const next = h.future.pop();
    set({ chats: get().chats.map(c => (c.id === id ? next : c)), histTick: get().histTick + 1 });
    persist();
    return true;
  },
  deleteChat(id) {
    set({ chats: get().chats.filter(c => c.id !== id) });
    persist();
  },
  duplicateChat(id) {
    const c = get().chats.find(x => x.id === id);
    if (!c) return;
    const copy = { ...structuredClone(c), id: uid(), title: c.title + ' (salinan)', pinned: false, updatedAt: Date.now() };
    set({ chats: [copy, ...get().chats] });
    persist();
  },
  saveAsPreset(id, title) {
    const c = get().chats.find(x => x.id === id);
    if (!c) return;
    const p = { ...structuredClone(c), id: 'my' + uid(), title: title || c.title, pinned: false, updatedAt: Date.now() };
    const myPresets = [p, ...get().myPresets].slice(0, 40);
    storage.set('myPresets', myPresets);
    set({ myPresets });
  },
  deleteMyPreset(pid) {
    const myPresets = get().myPresets.filter(p => p.id !== pid);
    storage.set('myPresets', myPresets);
    set({ myPresets });
  },
  fromMyPreset(p) {
    const map = {};
    const messages = p.messages.map(m => { const nid = uid(); map[m.id] = nid; return { ...m, id: nid }; }).map(m => (m.replyTo ? { ...m, replyTo: map[m.replyTo] } : m));
    return get().addChat({ ...structuredClone(p), id: uid(), messages, updatedAt: Date.now() });
  },
  setLabel(id, label) {
    set({ chats: get().chats.map(c => (c.id === id ? { ...c, label: label || '' } : c)) });
    persist();
  },
  togglePin(id) {
    set({ chats: get().chats.map(c => (c.id === id ? { ...c, pinned: !c.pinned } : c)) });
    persist();
  },
  restoreChat(chat) {
    set({ chats: [chat, ...get().chats].sort((a, b) => b.updatedAt - a.updatedAt) });
    persist();
  },
  clearAll() {
    set({ chats: [] });
    persist();
  },
  async exportAll(ids) {
    const chats = [];
    for (const c of get().chats.filter(x => !ids || ids.includes(x.id))) {
      const messages = [];
      for (const m of c.messages) messages.push(m.image ? { ...m, image: await readAsDataUrl(m.image).catch(() => null) } : m);
      const wallpaper = c.wallpaper?.type === 'image' ? { ...c.wallpaper, value: await readAsDataUrl(c.wallpaper.value).catch(() => '') } : c.wallpaper;
      chats.push({ ...c, messages, wallpaper });
    }
    return JSON.stringify({ app: 'ChatSim', v: 1, exportedAt: new Date().toISOString(), chats });
  },
  async importAll(text) {
    const data = JSON.parse(text);
    if (!Array.isArray(data?.chats)) throw new Error('File bukan cadangan ChatSim');
    const have = new Set(get().chats.map(c => c.id));
    const add = [];
    for (const raw of data.chats) {
      const messages = [];
      for (const m of raw.messages || []) messages.push(m.image?.startsWith('data:') ? { ...m, image: await putImage(m.image) } : m);
      let wallpaper = raw.wallpaper;
      if (wallpaper?.type === 'image' && wallpaper.value?.startsWith('data:')) wallpaper = { ...wallpaper, value: await putImage(wallpaper.value) };
      add.push(normalize({ ...raw, id: have.has(raw.id) ? uid() : raw.id, messages, wallpaper }));
    }
    set({ chats: [...add, ...get().chats] });
    persist();
    return add.length;
  }
}));

let timer = 0;
function persist() {
  clearTimeout(timer);
  timer = setTimeout(() => storage.set('chats', { v: 2, items: useStore.getState().chats }), 300);
}
