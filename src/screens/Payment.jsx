import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, QrCode, Landmark, Smartphone, HandCoins, Printer, Check, User } from 'lucide-react';
import { useStore, calcCart } from '../store.js';
import { nav, toast } from '../ui.js';
import { rp } from '../lib/format.js';
import { fx } from '../lib/fx.js';
import { Page, Field, MoneyInput } from '../components/ui.jsx';

const M = [
  { id: 'cash', name: 'Tunai', icon: Banknote },
  { id: 'qris', name: 'QRIS', icon: QrCode },
  { id: 'transfer', name: 'Transfer', icon: Landmark },
  { id: 'ewallet', name: 'E-Wallet', icon: Smartphone },
  { id: 'debt', name: 'Kasbon', icon: HandCoins }
];

export function suggestions(total, quick) {
  const set = new Set();
  [1000, 2000, 5000, 10000, 20000, 50000, 100000].forEach(step => { const v = Math.ceil(total / step) * step; if (v > total) set.add(v); });
  quick.forEach(v => { if (v > total) set.add(v); });
  return [...set].sort((a, b) => a - b).slice(0, 5);
}

export default function Payment() {
  const cart = useStore(s => s.cart); const s = useStore(st => st.settings);
  const c = calcCart(cart, s);
  const [method, setMethod] = useState('cash');
  const [paid, setPaid] = useState(0);
  const [dp, setDp] = useState(0);
  const [cust, setCust] = useState(cart.customer || '');
  const sug = useMemo(() => suggestions(c.total, s.quickCash || []), [c.total]);
  const change = paid - c.total;
  const isCash = method === 'cash', isDebt = method === 'debt';
  const canPay = c.lines.length > 0 && (isDebt ? cust.trim().length > 0 && dp < c.total : isCash ? paid >= c.total : true);

  const pay = print => {
    if (!canPay) return;
    if (isDebt) useStore.getState().setCart({ customer: cust.trim() });
    const sale = useStore.getState().checkout({ method: isDebt ? 'cash' : method, paid: isDebt ? dp : isCash ? paid : c.total, debt: isDebt });
    fx('cash');
    nav.replace('done', { saleId: sale.id, print });
  };

  if (!c.lines.length) return <Page title="Pembayaran"><div className="empty"><h3>Pesanan kosong</h3><button className="btn primary" onClick={() => nav.pop()}>Kembali ke Kasir</button></div></Page>;

  return (
    <Page title="Pembayaran" sub={`${c.qty} barang${cart.customer ? ' · ' + cart.customer : ''}`}
      footer={
        <div className="col gap8">
          {isCash && paid > 0 && paid < c.total && <div className="small bold red" style={{ textAlign: 'center' }}>Uang kurang {rp(c.total - paid)}</div>}
          <div className="row gap12">
            <button className="btn outline" style={{ flex: '0 0 auto' }} disabled={!canPay} onClick={() => pay(false)}><Check size={20} /> Simpan</button>
            <button className="btn primary lg grow" disabled={!canPay} onClick={() => pay(true)}><Printer size={21} /> Bayar & Cetak</button>
          </div>
        </div>
      }>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
        <div className="small bold muted">Total yang harus dibayar</div>
        <div className="num" style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-.02em', marginTop: 4 }}>{rp(c.total)}</div>
        {(c.discount > 0 || c.tax > 0 || c.service > 0) && <div className="small muted mt8">
          Subtotal {rp(c.subtotal)}{c.discount ? ` · Diskon -${rp(c.discount)}` : ''}{c.service ? ` · Layanan ${rp(c.service)}` : ''}{c.tax ? ` · Pajak ${rp(c.tax)}` : ''}
        </div>}
      </motion.div>

      <div className="section-title">Cara bayar</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {M.map(m => {
          const on = method === m.id; const Icon = m.icon;
          return (
            <motion.button key={m.id} whileTap={{ scale: 0.93 }} onClick={() => { fx('tap'); setMethod(m.id); }}
              className="col" style={{ alignItems: 'center', gap: 6, padding: '12px 2px', borderRadius: 18, background: on ? 'var(--primary)' : 'var(--surface)', color: on ? 'var(--on-primary)' : 'var(--text)', boxShadow: on ? '0 6px 16px color-mix(in srgb, var(--primary) 35%, transparent)' : 'var(--shadow)', transition: 'background .15s' }}>
              <Icon size={24} /><span className="tiny bold">{m.name}</span>
            </motion.button>
          );
        })}
      </div>

      {isCash && <>
        <div className="section-title">Uang diterima</div>
        <MoneyInput value={paid} onChange={setPaid} big autoFocus={false} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
          <button className={'btn sm ' + (paid === c.total ? 'primary' : 'soft')} onClick={() => { fx('tap'); setPaid(c.total); }}>Uang pas</button>
          {sug.map(v => <button key={v} className={'btn sm ' + (paid === v ? 'primary' : 'outline')} onClick={() => { fx('tap'); setPaid(v); }}>{rp(v, false)}</button>)}
        </div>
        <motion.div animate={{ scale: paid >= c.total && paid > 0 ? [1, 1.03, 1] : 1 }} key={paid} className="card mt16 row" style={{ justifyContent: 'space-between', background: paid >= c.total && paid > 0 ? 'var(--income-soft)' : 'var(--surface)' }}>
          <span className="bold">Kembalian</span>
          <span className="num" style={{ fontSize: '1.6rem', fontWeight: 800, color: paid >= c.total && paid > 0 ? 'var(--income)' : 'var(--muted)' }}>{paid >= c.total ? rp(change) : '—'}</span>
        </motion.div>
      </>}

      {(method === 'qris' || method === 'transfer' || method === 'ewallet') && (
        <div className="card mt16" style={{ background: 'var(--info-soft)', boxShadow: 'none' }}>
          <div className="bold">Pastikan uang sudah masuk</div>
          <div className="small muted mt8">Cek notifikasi {method === 'qris' ? 'QRIS' : method === 'transfer' ? 'rekening bank' : 'dompet digital'} Anda sebesar <b className="num">{rp(c.total)}</b> sebelum menekan bayar.</div>
        </div>
      )}

      {isDebt && <>
        <div className="card mt16" style={{ background: 'var(--accent-soft)', boxShadow: 'none' }}>
          <div className="bold">Kasbon / bayar nanti</div>
          <div className="small muted mt8">Transaksi dicatat sebagai utang pelanggan. Anda bisa melunasinya nanti dari menu Kasbon.</div>
        </div>
        <div className="mt16">
          <Field label="Nama pelanggan (wajib)">
            <div className="input-wrap"><span className="prefix"><User size={18} /></span><input className="input" value={cust} onChange={e => setCust(e.target.value)} placeholder="Contoh: Pak Budi" /></div>
          </Field>
          <Field label="Bayar sebagian sekarang (opsional)" hint={dp ? `Sisa utang ${rp(Math.max(0, c.total - dp))}` : 'Kosongkan jika belum bayar sama sekali'}>
            <MoneyInput value={dp} onChange={v => { if (v >= c.total) { toast('Kalau dibayar penuh, pilih Tunai saja', { type: 'error' }); return; } setDp(v); }} />
          </Field>
        </div>
      </>}
    </Page>
  );
}
