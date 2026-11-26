// PIN hashing (SHA-256 with an app salt). Not bank-grade — it keeps casual eyes out of the books.
const SALT = 'strukku::v1::';
export async function hashPin(pin) {
  const data = new TextEncoder().encode(SALT + String(pin).trim().toLowerCase());
  try {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 2166136261; for (const b of data) { h ^= b; h = Math.imul(h, 16777619); } return 'f' + (h >>> 0).toString(16);
  }
}
