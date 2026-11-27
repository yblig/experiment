import { EXPENSE_CATS, INCOME_CATS, METHODS, methodName } from '../store.js';
import { startOfDay } from './format.js';

export const catOf = (type, id) => (type === 'out' ? EXPENSE_CATS : INCOME_CATS).find(c => c.id === id) || { id, name: id || 'Lainnya', emoji: '📝' };

export function computeReport(st, from, to, label = '') {
  const sales = st.sales.filter(s => s.date >= from && s.date < to);
  const valid = sales.filter(s => s.status !== 'void');
  const fin = st.finance.filter(f => f.date >= from && f.date < to);
  const omzet = valid.reduce((a, s) => a + s.total, 0);
  const cost = valid.reduce((a, s) => a + (s.cost || 0), 0);
  const qty = valid.reduce((a, s) => a + s.qty, 0);
  const otherIn = fin.filter(f => f.type === 'in').reduce((a, f) => a + f.amount, 0);
  const out = fin.filter(f => f.type === 'out').reduce((a, f) => a + f.amount, 0);
  const gross = omzet - cost;
  const net = gross + otherIn - out;
  const m = {};
  valid.forEach(s => { const k = s.method; m[k] = (m[k] || 0) + (s.method === 'debt' ? (s.payments || []).reduce((a, p) => a + p.amount, 0) : s.total); });
  const methods = [...METHODS.map(x => x.id), 'debt'].filter(k => m[k]).map(k => ({ id: k, name: k === 'debt' ? 'Kasbon (dibayar)' : methodName(k), amount: m[k] }));
  const debtOpen = valid.filter(s => s.status === 'debt').reduce((a, s) => a + s.total - (s.payments || []).reduce((x, p) => x + p.amount, 0), 0);
  const prod = {};
  valid.forEach(s => s.items.forEach(i => {
    const k = i.pid || 'm:' + i.name;
    prod[k] = prod[k] || { name: i.name, emoji: i.emoji, unit: i.unit, qty: 0, amount: 0, profit: 0 };
    prod[k].qty = Math.round((prod[k].qty + i.qty) * 100) / 100; prod[k].amount += i.total ?? Math.round(i.price * i.qty); prod[k].profit += Math.round((i.total ?? i.price * i.qty) - (i.cost || 0) * i.qty);
  }));
  const top = Object.values(prod).sort((a, b) => b.qty - a.qty);
  const oc = {};
  fin.filter(f => f.type === 'out').forEach(f => { oc[f.cat] = (oc[f.cat] || 0) + f.amount; });
  const outCats = Object.entries(oc).map(([id, amount]) => ({ ...catOf('out', id), amount })).sort((a, b) => b.amount - a.amount);
  const ic = {};
  fin.filter(f => f.type === 'in').forEach(f => { ic[f.cat] = (ic[f.cat] || 0) + f.amount; });
  const inCats = Object.entries(ic).map(([id, amount]) => ({ ...catOf('in', id), amount })).sort((a, b) => b.amount - a.amount);
  const hours = Array.from({ length: 24 }, () => ({ omzet: 0, count: 0 }));
  valid.forEach(x => { const h = new Date(x.date).getHours(); hours[h].omzet += x.total; hours[h].count++; });
  const catMap = new Map(st.products.map(p => [p.id, p.catId]));
  const bc = {};
  valid.forEach(x => x.items.forEach(i => { const cid = (i.pid && catMap.get(i.pid)) || '_'; bc[cid] = (bc[cid] || 0) + (i.total ?? Math.round(i.price * i.qty)); }));
  const byCat = Object.entries(bc).map(([id, amount]) => { const c = st.categories.find(k => k.id === id); return { id, name: c?.name || 'Tanpa kategori', color: c?.color || '#5B6770', amount }; }).sort((a, b) => b.amount - a.amount);
  const kc = {};
  valid.forEach(x => { const k = x.cashier || 'Tanpa nama'; kc[k] = kc[k] || { name: k, amount: 0, count: 0 }; kc[k].amount += x.total; kc[k].count++; });
  const byCashier = Object.values(kc).sort((a, b) => b.amount - a.amount);
  const extra = valid.reduce((a, x) => a + (x.extra || 0), 0);
  const saved = valid.reduce((a, x) => a + (x.saved || 0), 0);
  return { hours, byCat, byCashier, extra, saved, label, from, to, count: valid.length, voids: sales.length - valid.length, omzet, cost, gross, qty, otherIn, out, net, methods, debtOpen, top, outCats, inCats, avg: valid.length ? Math.round(omzet / valid.length) : 0 };
}

export function dailySeries(st, days = 7, end = Date.now()) {
  const today = startOfDay(end);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const from = today - i * 864e5, to = from + 864e5;
    const valid = st.sales.filter(s => s.date >= from && s.date < to && s.status !== 'void');
    const exp = st.finance.filter(f => f.type === 'out' && f.date >= from && f.date < to).reduce((a, f) => a + f.amount, 0);
    out.push({ from, omzet: valid.reduce((a, s) => a + s.total, 0), out: exp, count: valid.length });
  }
  return out;
}
