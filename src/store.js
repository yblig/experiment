// App state (zustand) persisted to device storage.
import { create } from 'zustand';
import { storage } from './lib/storage.js';
import { uid } from './lib/format.js';

export const SCHEMA = 1;

export const DEFAULT_SETTINGS = {
  storeName: 'Toko Saya',
  address: '',
  phone: '',
  header: '',
  footer: 'Terima kasih atas kunjungan Anda\nBarang yang sudah dibeli tidak dapat dikembalikan',
  showLogo: true,
  logoWidth: 60,
  logoMode: 'sharp',
  logoDark: 50,
  paper: 58,
  prefix: 'INV',
  taxPct: 0,
  servicePct: 0,
  cashier: '',
  showCashier: true,
  showCustomer: true,
  showQr: false,
  qrText: '',
  qrLabel: 'Scan untuk info & promo',
  copies: 1,
  autoCut: true,
  feedLines: 3,
  autoPrint: false,
  theme: 'system',
  bigText: false,
  sound: true,
  haptics: true,
  autoConnect: true,
  printerAddress: null,
  printerName: null,
  lowStock: 5,
  pin: null,
  pinQ: '',
  pinA: null,
  lock: { finance: true, reports: true, settings: false, void: true, app: false },
  onboarded: false,
  quickCash: [10000, 20000, 50000, 100000],
  bizType: 'food',
  trackOrders: false,
  dueDays: 2
};

// ---------- business types & units ----------
export const UNITS = [
  { id: 'pcs', name: 'pcs' }, { id: 'porsi', name: 'porsi' }, { id: 'kg', name: 'kg', dec: true }, { id: 'gram', name: 'gram' },
  { id: 'liter', name: 'liter', dec: true }, { id: 'meter', name: 'meter', dec: true }, { id: 'pasang', name: 'pasang' },
  { id: 'set', name: 'set' }, { id: 'lembar', name: 'lembar' }, { id: 'bungkus', name: 'bungkus' }, { id: 'jam', name: 'jam', dec: true }
];
export const isDec = u => !!UNITS.find(x => x.id === u)?.dec;
export const fmtQty = (q, unit) => {
  const n = Math.round((Number(q) || 0) * 100) / 100;
  const t = String(n).replace('.', ',');
  return unit && unit !== 'pcs' ? `${t} ${unit}` : t;
};

export const BIZ_TYPES = [
  { id: 'food', name: 'Makanan & Minuman', emoji: '🍛', desc: 'Warung, kafe, katering, jajanan', item: 'Menu' },
  { id: 'laundry', name: 'Laundry', emoji: '🧺', desc: 'Kiloan, satuan, setrika, sepatu', item: 'Layanan', track: true, prefix: 'LDR' },
  { id: 'retail', name: 'Toko / Kelontong', emoji: '🛒', desc: 'Sembako, minimarket, toko pakaian', item: 'Barang' },
  { id: 'service', name: 'Jasa', emoji: '🛠️', desc: 'Servis, potong rambut, jahit, cetak', item: 'Jasa', track: true },
  { id: 'other', name: 'Usaha lainnya', emoji: '🏪', desc: 'Atur sendiri sesuai usaha Anda', item: 'Produk' }
];
export const bizOf = id => BIZ_TYPES.find(b => b.id === id) || BIZ_TYPES[0];
export const WORK = [
  { id: 'process', name: 'Diproses', color: 'var(--info)', bg: 'var(--info-soft)' },
  { id: 'ready', name: 'Siap diambil', color: 'var(--income)', bg: 'var(--income-soft)' },
  { id: 'done', name: 'Sudah diambil', color: 'var(--muted)', bg: 'var(--bg2)' }
];

export const COLORS = ['#0E7C66', '#2F6FDB', '#DC4B3E', '#F2A93B', '#8E5BD8', '#D9488F', '#1FA3B5', '#6B8E23', '#B5651D', '#5B6770'];

export const EXPENSE_CATS = [
  { id: 'bahan', name: 'Belanja Bahan', emoji: '🛒' },
  { id: 'gaji', name: 'Gaji Karyawan', emoji: '👥' },
  { id: 'listrik', name: 'Listrik & Air', emoji: '💡' },
  { id: 'sewa', name: 'Sewa Tempat', emoji: '🏠' },
  { id: 'transport', name: 'Transport & Bensin', emoji: '🛵' },
  { id: 'gas', name: 'Gas & Bahan Bakar', emoji: '🔥' },
  { id: 'peralatan', name: 'Peralatan', emoji: '🔧' },
  { id: 'pulsa', name: 'Pulsa & Internet', emoji: '📶' },
  { id: 'kemasan', name: 'Kemasan & Plastik', emoji: '📦' },
  { id: 'lain', name: 'Lainnya', emoji: '📝' }
];
export const INCOME_CATS = [
  { id: 'modal', name: 'Tambah Modal', emoji: '💼' },
  { id: 'pesanan', name: 'Pesanan / Katering', emoji: '🍱' },
  { id: 'jasa', name: 'Jasa', emoji: '🛠️' },
  { id: 'piutang', name: 'Pelunasan Utang', emoji: '🤝' },
  { id: 'titipan', name: 'Titipan / Konsinyasi', emoji: '🧺' },
  { id: 'lain', name: 'Lainnya', emoji: '📝' }
];
export const METHODS = [
  { id: 'cash', name: 'Tunai' },
  { id: 'qris', name: 'QRIS' },
  { id: 'transfer', name: 'Transfer' },
  { id: 'ewallet', name: 'E-Wallet' }
];
export const methodName = id => (METHODS.find(m => m.id === id) || { name: id === 'debt' ? (useStore.getState().settings.trackOrders ? 'Bayar nanti' : 'Kasbon') : id }).name;

export function sampleData(type = 'food') {
  const P = (name, price, cost, catId, emoji, stock = null, unit = 'pcs') => ({ id: uid(), name, price, cost, catId, emoji, stock, unit, sold: 0, fav: false, created: Date.now() });
  if (type === 'laundry') {
    const cats = [{ id: 'l1', name: 'Kiloan', color: '#2F6FDB' }, { id: 'l2', name: 'Satuan', color: '#8E5BD8' }, { id: 'l3', name: 'Ekspres', color: '#DC4B3E' }, { id: 'l4', name: 'Tambahan', color: '#5B6770' }];
    return { categories: cats, products: [
      P('Cuci Kering Lipat', 6000, 2000, 'l1', '🧺', null, 'kg'),
      P('Cuci Setrika', 8000, 3000, 'l1', '👕', null, 'kg'),
      P('Setrika Saja', 5000, 1500, 'l1', '♨️', null, 'kg'),
      P('Cuci Setrika Ekspres 1 Hari', 12000, 3500, 'l3', '⚡', null, 'kg'),
      P('Bed Cover', 25000, 8000, 'l2', '🛏️'),
      P('Selimut', 15000, 5000, 'l2', '🧣'),
      P('Sprei Set', 15000, 5000, 'l2', '🛌', null, 'set'),
      P('Jas / Blazer', 20000, 6000, 'l2', '🧥'),
      P('Gorden', 10000, 3000, 'l2', '🪟', null, 'kg'),
      P('Cuci Sepatu', 25000, 6000, 'l2', '👟', null, 'pasang'),
      P('Boneka', 15000, 4000, 'l2', '🧸'),
      P('Pewangi Ekstra', 2000, 500, 'l4', '🌸'),
      P('Plastik / Hanger', 1000, 500, 'l4', '🛍️')
    ] };
  }
  if (type === 'retail') {
    const cats = [{ id: 'r1', name: 'Sembako', color: '#B5651D' }, { id: 'r2', name: 'Minuman', color: '#2F6FDB' }, { id: 'r3', name: 'Kebutuhan Rumah', color: '#8E5BD8' }, { id: 'r4', name: 'Jajanan', color: '#F2A93B' }];
    return { categories: cats, products: [
      P('Beras', 14000, 12000, 'r1', '🍚', 50, 'kg'), P('Gula Pasir', 17000, 15000, 'r1', '🧂', 20, 'kg'), P('Minyak Goreng 1L', 18000, 16000, 'r1', '🫗', 24),
      P('Telur', 30000, 27000, 'r1', '🥚', 15, 'kg'), P('Mie Instan', 3500, 2800, 'r1', '🍜', 80), P('Air Mineral 600ml', 4000, 2700, 'r2', '💧', 48),
      P('Teh Botol', 5000, 3800, 'r2', '🧃', 24), P('Kopi Sachet', 2000, 1400, 'r2', '☕', 60), P('Sabun Mandi', 4500, 3500, 'r3', '🧼', 20),
      P('Deterjen', 6000, 4800, 'r3', '🫧', 20), P('Tisu', 10000, 8000, 'r3', '🧻', 10), P('Gas LPG 3 kg', 22000, 19000, 'r3', '🔥', 6), P('Wafer', 2000, 1400, 'r4', '🍫', 40)
    ] };
  }
  if (type === 'service') {
    const cats = [{ id: 's1', name: 'Layanan', color: '#0E7C66' }, { id: 's2', name: 'Suku Cadang', color: '#5B6770' }];
    return { categories: cats, products: [
      P('Jasa Servis Ringan', 50000, 0, 's1', '🛠️'), P('Jasa Servis Berat', 150000, 0, 's1', '🔧'), P('Potong Rambut', 25000, 0, 's1', '💈'),
      P('Jahit / Permak', 20000, 3000, 's1', '🧵'), P('Cetak / Print', 1000, 300, 's1', '🖨️', null, 'lembar'), P('Fotokopi', 300, 100, 's1', '📄', null, 'lembar'),
      P('Ongkos Kerja', 50000, 0, 's1', '⏱️', null, 'jam'), P('Sparepart', 35000, 25000, 's2', '⚙️', 10)
    ] };
  }
  const cats = [
    { id: 'c1', name: 'Makanan', color: '#DC4B3E' },
    { id: 'c2', name: 'Minuman', color: '#2F6FDB' },
    { id: 'c3', name: 'Camilan', color: '#F2A93B' },
    { id: 'c4', name: 'Lainnya', color: '#5B6770' }
  ];
  const products = [
    P('Nasi Goreng Spesial', 18000, 10000, 'c1', '🍛'),
    P('Mie Goreng', 15000, 8000, 'c1', '🍜'),
    P('Ayam Geprek', 17000, 10000, 'c1', '🍗'),
    P('Nasi Uduk', 12000, 6500, 'c1', '🍚'),
    P('Soto Ayam', 15000, 8500, 'c1', '🥣'),
    P('Es Teh Manis', 4000, 1200, 'c2', '🧋'),
    P('Es Jeruk', 6000, 2500, 'c2', '🍊'),
    P('Kopi Susu', 8000, 3500, 'c2', '☕'),
    P('Air Mineral', 4000, 2500, 'c2', '💧', 24),
    P('Pisang Goreng', 2000, 800, 'c3', '🍌', 30),
    P('Keripik Singkong', 5000, 3000, 'c3', '🥔', 4),
    P('Kerupuk', 1000, 500, 'c3', '🍘', 50),
    P('Bungkus / Kemasan', 1000, 500, 'c4', '🥡')
  ];
  return { categories: cats, products };
}

const emptyCart = () => ({ items: [], discType: 'pct', discVal: 0, customer: '', customerId: null, phone: '', note: '', heldId: null, due: null });

const blank = () => ({
  v: SCHEMA,
  settings: { ...DEFAULT_SETTINGS },
  categories: [],
  products: [],
  sales: [],
  finance: [],
  customers: [],
  held: [],
  counter: 0,
  cart: emptyCart()
});

export function calcCart(cart, s) {
  const lines = cart.items.map(i => ({ ...i, total: Math.max(0, Math.round(i.price * i.qty) - (i.disc || 0)) }));
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  const qty = lines.reduce((a, l) => a + (isDec(l.unit) ? 1 : l.qty), 0); // item count (a weighed line counts once)
  let discount = cart.discType === 'pct' ? Math.round(subtotal * (Number(cart.discVal) || 0) / 100) : Number(cart.discVal) || 0;
  discount = Math.min(discount, subtotal);
  const after = subtotal - discount;
  const service = Math.round(after * (Number(s.servicePct) || 0) / 100);
  const tax = Math.round((after + service) * (Number(s.taxPct) || 0) / 100);
  const total = after + service + tax;
  const cost = Math.round(lines.reduce((a, l) => a + (l.cost || 0) * l.qty, 0));
  return { lines, subtotal, qty, discount, service, tax, total, cost };
}

function receiptNo(s, n, ts) {
  const d = new Date(ts);
  const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  return `${(s.prefix || 'INV').toUpperCase()}-${ymd}-${String(n).padStart(4, '0')}`;
}

function load() {
  const saved = storage.get('db', null);
  if (!saved) return blank();
  const base = blank();
  const db = { ...base, ...saved, settings: { ...base.settings, ...(saved.settings || {}), lock: { ...base.settings.lock, ...(saved.settings?.lock || {}) } } };
  db.cart = { ...emptyCart(), ...(saved.cart || {}) };
  db.v = SCHEMA;
  return db;
}

export const useStore = create((set, get) => ({
  ...blank(),
  logo: null,
  hydrated: false,

  hydrate() { set({ ...load(), logo: storage.get('logo', null), hydrated: true }); },

  // ---------- settings ----------
  setSettings(patch) { set(st => ({ settings: { ...st.settings, ...patch } })); },
  setLock(patch) { set(st => ({ settings: { ...st.settings, lock: { ...st.settings.lock, ...patch } } })); },
  setLogo(logo) { set({ logo }); storage.set('logo', logo); },

  // ---------- catalogue ----------
  saveProduct(p) {
    set(st => {
      const exists = st.products.some(x => x.id === p.id);
      return { products: exists ? st.products.map(x => (x.id === p.id ? { ...x, ...p } : x)) : [...st.products, { id: uid(), sold: 0, created: Date.now(), ...p }] };
    });
  },
  deleteProduct(id) { set(st => ({ products: st.products.filter(p => p.id !== id) })); },
  restoreProduct(p) { set(st => ({ products: [...st.products, p] })); },
  adjustStock(id, delta) { set(st => ({ products: st.products.map(p => (p.id === id && p.stock != null ? { ...p, stock: Math.max(0, Math.round((p.stock + delta) * 100) / 100) } : p)) })); },
  toggleFav(id) { set(st => ({ products: st.products.map(p => (p.id === id ? { ...p, fav: !p.fav } : p)) })); },
  saveCategory(c) {
    set(st => {
      const exists = st.categories.some(x => x.id === c.id);
      return { categories: exists ? st.categories.map(x => (x.id === c.id ? { ...x, ...c } : x)) : [...st.categories, { id: uid(), ...c }] };
    });
  },
  deleteCategory(id) { set(st => ({ categories: st.categories.filter(c => c.id !== id), products: st.products.map(p => (p.catId === id ? { ...p, catId: null } : p)) })); },
  loadSample(type) { const d = sampleData(type || get().settings.bizType); set(st => ({ categories: [...st.categories, ...d.categories.filter(c => !st.categories.some(x => x.id === c.id))], products: [...st.products, ...d.products] })); },

  // ---------- cart ----------
  addToCart(p, qty = 1) {
    set(st => {
      const items = [...st.cart.items];
      const i = items.findIndex(x => x.pid === p.id && !x.custom);
      if (i >= 0) items[i] = { ...items[i], qty: Math.round((items[i].qty + qty) * 100) / 100 };
      else items.push({ key: uid(), pid: p.id, name: p.name, price: p.price, cost: p.cost || 0, qty, disc: 0, emoji: p.emoji, unit: p.unit || 'pcs' });
      return { cart: { ...st.cart, items } };
    });
  },
  setLineQty(pid, qty) {
    set(st => {
      const items = st.cart.items.filter(x => !(x.pid === pid && !x.custom && qty <= 0)).map(x => (x.pid === pid && !x.custom ? { ...x, qty } : x));
      return { cart: { ...st.cart, items } };
    });
  },
  addManual(name, price, qty = 1, unit = 'pcs') {
    set(st => ({ cart: { ...st.cart, items: [...st.cart.items, { key: uid(), pid: null, custom: true, name, price, cost: 0, qty, disc: 0, emoji: '✏️', unit }] } }));
  },
  setQty(key, qty) {
    set(st => ({ cart: { ...st.cart, items: qty <= 0 ? st.cart.items.filter(i => i.key !== key) : st.cart.items.map(i => (i.key === key ? { ...i, qty } : i)) } }));
  },
  updateLine(key, patch) { set(st => ({ cart: { ...st.cart, items: st.cart.items.map(i => (i.key === key ? { ...i, ...patch } : i)) } })); },
  removeLine(key) { set(st => ({ cart: { ...st.cart, items: st.cart.items.filter(i => i.key !== key) } })); },
  setCart(patch) { set(st => ({ cart: { ...st.cart, ...patch } })); },
  clearCart() { set({ cart: emptyCart() }); },

  holdCart(label) {
    const st = get();
    if (!st.cart.items.length) return;
    const h = { id: st.cart.heldId || uid(), date: Date.now(), label: label || st.cart.customer || `Pesanan ${st.held.length + 1}`, cart: { ...st.cart, heldId: null } };
    set({ held: [h, ...st.held.filter(x => x.id !== h.id)], cart: emptyCart() });
  },
  resumeHeld(id) {
    const st = get(); const h = st.held.find(x => x.id === id); if (!h) return;
    let held = st.held.filter(x => x.id !== id);
    if (st.cart.items.length) held = [{ id: uid(), date: Date.now(), label: st.cart.customer || 'Pesanan ditahan', cart: st.cart }, ...held];
    set({ cart: { ...emptyCart(), ...h.cart, heldId: null }, held });
  },
  deleteHeld(id) { set(st => ({ held: st.held.filter(x => x.id !== id) })); },

  checkout({ method, paid, debt = false }) {
    const st = get(); const s = st.settings;
    const c = calcCart(st.cart, s);
    const date = Date.now();
    const counter = st.counter + 1;
    const sale = {
      id: uid(), no: receiptNo(s, counter, date), date,
      items: c.lines.map(l => ({ pid: l.pid, name: l.name, price: l.price, cost: l.cost || 0, qty: l.qty, unit: l.unit || 'pcs', disc: l.disc || 0, total: l.total, emoji: l.emoji })),
      qty: c.qty, subtotal: c.subtotal, discount: c.discount, discLabel: st.cart.discType === 'pct' && st.cart.discVal ? `${st.cart.discVal}%` : '',
      service: c.service, servicePct: s.servicePct, tax: c.tax, taxPct: s.taxPct, total: c.total, cost: c.cost,
      method: debt ? 'debt' : method, paid: debt ? (paid || 0) : paid, change: debt ? 0 : Math.max(0, paid - c.total),
      status: debt && (paid || 0) < c.total ? 'debt' : 'paid',
      payments: debt && paid ? [{ date, amount: paid, method }] : [],
      customer: st.cart.customer || '', customerId: st.cart.customerId || null, note: st.cart.note || '',
      cashier: s.cashier || '', phone: st.cart.phone || '',
      due: st.cart.due || null, work: st.cart.due ? 'process' : null
    };
    const sold = {}; sale.items.forEach(i => { if (i.pid) sold[i.pid] = (sold[i.pid] || 0) + i.qty; });
    let customers = st.customers;
    if (sale.customer && !sale.customerId) {
      const ex = customers.find(x => x.name.toLowerCase() === sale.customer.toLowerCase());
      if (ex) sale.customerId = ex.id;
      else { const nc = { id: uid(), name: sale.customer, phone: sale.phone || '', note: '', created: date }; customers = [...customers, nc]; sale.customerId = nc.id; }
    }
    if (sale.customerId && sale.phone) customers = customers.map(x => (x.id === sale.customerId && !x.phone ? { ...x, phone: sale.phone } : x));
    if (!sale.phone && sale.customerId) sale.phone = customers.find(x => x.id === sale.customerId)?.phone || '';
    set({
      sales: [sale, ...st.sales], counter, cart: emptyCart(), customers,
      products: st.products.map(p => (sold[p.id] ? { ...p, sold: Math.round(((p.sold || 0) + sold[p.id]) * 100) / 100, stock: p.stock != null ? Math.max(0, Math.round((p.stock - sold[p.id]) * 100) / 100) : null } : p))
    });
    return sale;
  },
  setWork(id, work) { set(st => ({ sales: st.sales.map(x => (x.id === id ? { ...x, work, [work + 'At']: Date.now() } : x)) })); },
  setBizType(type) {
    const b = bizOf(type);
    set(st => ({ settings: { ...st.settings, bizType: type, trackOrders: !!b.track, ...(b.prefix && st.settings.prefix === 'INV' ? { prefix: b.prefix } : {}) } }));
  },
  voidSale(id, reason = '') {
    const st = get(); const sale = st.sales.find(x => x.id === id); if (!sale || sale.status === 'void') return;
    const back = {}; sale.items.forEach(i => { if (i.pid) back[i.pid] = (back[i.pid] || 0) + i.qty; });
    set({
      sales: st.sales.map(x => (x.id === id ? { ...x, status: 'void', voidAt: Date.now(), voidReason: reason } : x)),
      products: st.products.map(p => (back[p.id] ? { ...p, sold: Math.max(0, (p.sold || 0) - back[p.id]), stock: p.stock != null ? p.stock + back[p.id] : null } : p))
    });
  },
  payDebt(id, amount, method = 'cash') {
    set(st => ({
      sales: st.sales.map(x => {
        if (x.id !== id) return x;
        const payments = [...(x.payments || []), { date: Date.now(), amount, method }];
        const paid = payments.reduce((a, p) => a + p.amount, 0);
        return { ...x, payments, paid, status: paid >= x.total ? 'paid' : 'debt', settledAt: paid >= x.total ? Date.now() : undefined };
      })
    }));
  },

  // ---------- finance ----------
  saveFinance(f) {
    set(st => {
      const exists = st.finance.some(x => x.id === f.id);
      return { finance: exists ? st.finance.map(x => (x.id === f.id ? { ...x, ...f } : x)) : [{ id: uid(), date: Date.now(), ...f }, ...st.finance] };
    });
  },
  deleteFinance(id) { set(st => ({ finance: st.finance.filter(f => f.id !== id) })); },
  restoreFinance(f) { set(st => ({ finance: [f, ...st.finance].sort((a, b) => b.date - a.date) })); },

  // ---------- customers ----------
  saveCustomer(c) {
    set(st => {
      const exists = st.customers.some(x => x.id === c.id);
      return { customers: exists ? st.customers.map(x => (x.id === c.id ? { ...x, ...c } : x)) : [...st.customers, { id: uid(), created: Date.now(), ...c }] };
    });
  },
  deleteCustomer(id) { set(st => ({ customers: st.customers.filter(c => c.id !== id) })); },

  // ---------- data ----------
  exportData() { const st = get(); return { app: 'StrukKu', v: SCHEMA, exported: Date.now(), settings: st.settings, categories: st.categories, products: st.products, sales: st.sales, finance: st.finance, customers: st.customers, held: st.held, counter: st.counter, logo: st.logo }; },
  importData(d) {
    if (!d || d.app !== 'StrukKu') throw new Error('File bukan cadangan StrukKu');
    const base = blank();
    set({ ...base, ...d, settings: { ...base.settings, ...d.settings, lock: { ...base.settings.lock, ...(d.settings?.lock || {}) } }, cart: emptyCart(), logo: d.logo || null });
    storage.set('logo', d.logo || null);
  },
  resetAll(keepSettings = true) {
    const st = get();
    set({ ...blank(), settings: keepSettings ? st.settings : { ...DEFAULT_SETTINGS, onboarded: true }, logo: keepSettings ? st.logo : null });
  }
}));

// Persist (debounced) — logo is kept under its own key so big images aren't rewritten every change.
let timer = null;
export function startPersist() {
  useStore.subscribe(st => {
    if (!st.hydrated) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const { settings, categories, products, sales, finance, customers, held, counter, cart, v } = useStore.getState();
      storage.set('db', { v, settings, categories, products, sales, finance, customers, held, counter, cart });
    }, 250);
  });
}
