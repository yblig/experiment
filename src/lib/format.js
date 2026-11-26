// Formatting helpers (Rupiah, tanggal Indonesia)
export const rp = (n, withRp = true) => {
  const v = Math.round(Number(n) || 0);
  const s = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (v < 0 ? '-' : '') + (withRp ? 'Rp' : '') + s;
};
export const rpShort = n => {
  const v = Math.abs(Number(n) || 0), sign = n < 0 ? '-' : '';
  if (v >= 1e9) return sign + (v / 1e9).toFixed(v >= 1e10 ? 0 : 1).replace('.', ',') + 'M';
  if (v >= 1e6) return sign + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace('.', ',') + 'jt';
  if (v >= 1e3) return sign + Math.round(v / 1e3) + 'rb';
  return sign + v;
};
export const parseNum = s => Number(String(s ?? '').replace(/[^\d]/g, '')) || 0;
export const fmtInput = s => { const n = parseNum(s); return n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''; };

export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const BLN = BULAN.map(b => b.slice(0, 3));
const p2 = n => String(n).padStart(2, '0');

export const fmtTime = ts => { const d = new Date(ts); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; };
export const fmtDate = ts => { const d = new Date(ts); return `${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()}`; };
export const fmtDateLong = ts => { const d = new Date(ts); return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`; };
export const fmtDateTime = ts => `${fmtDate(ts)} ${fmtTime(ts)}`;
export const fmtReceiptDate = ts => { const d = new Date(ts); return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
export const toDateInput = ts => { const d = new Date(ts); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
export const fromDateInput = (s, keepTime = Date.now()) => {
  const [y, m, dd] = s.split('-').map(Number); const t = new Date(keepTime);
  return new Date(y, m - 1, dd, t.getHours(), t.getMinutes()).getTime();
};

export const startOfDay = (ts = Date.now()) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const dayKey = ts => startOfDay(ts);
export const relDay = ts => {
  const t = startOfDay(ts), today = startOfDay();
  if (t === today) return 'Hari ini';
  if (t === today - 864e5) return 'Kemarin';
  return fmtDateLong(ts);
};
export const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
};

export function periodRange(key) {
  const now = new Date(); const today = startOfDay();
  switch (key) {
    case 'today': return [today, today + 864e5, 'Hari ini'];
    case 'yesterday': return [today - 864e5, today, 'Kemarin'];
    case '7d': return [today - 6 * 864e5, today + 864e5, '7 hari terakhir'];
    case 'month': { const s = new Date(now.getFullYear(), now.getMonth(), 1).getTime(); return [s, today + 864e5, BULAN[now.getMonth()] + ' ' + now.getFullYear()]; }
    case 'lastmonth': { const s = new Date(now.getFullYear(), now.getMonth() - 1, 1); const e = new Date(now.getFullYear(), now.getMonth(), 1); return [s.getTime(), e.getTime(), BULAN[s.getMonth()] + ' ' + s.getFullYear()]; }
    default: return [0, today + 864e5, 'Semua waktu'];
  }
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
