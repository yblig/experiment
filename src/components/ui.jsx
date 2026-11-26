import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Check, AlertTriangle, Info, Delete, Lock, KeyRound } from 'lucide-react';
import { native } from '../lib/native.js';
import { fx } from '../lib/fx.js';
import { useUI, nav } from '../ui.js';
import { useStore } from '../store.js';
import { hashPin } from '../lib/pin.js';
import { fmtInput, parseNum } from '../lib/format.js';
import { prepareImages, renderReceiptCanvas } from '../lib/receipt.js';

export function useBack(fn, active = true) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => { if (!active) return; return native.onBack(() => { ref.current(); return true; }); }, [active]);
}

export function Header({ title, sub, back = true, onBack, right, children }) {
  return (
    <div className="header">
      {back && <button className="icon-btn" onClick={() => { fx('tap'); (onBack || nav.pop)(); }} aria-label="Kembali"><ArrowLeft size={24} /></button>}
      <div className="grow" style={{ paddingLeft: back ? 0 : 6 }}>
        <h1>{title}</h1>
        {sub && <div className="sub ellipsis">{sub}</div>}
      </div>
      {right}
      {children}
    </div>
  );
}

export function Page({ title, sub, right, children, back = true, onBack, footer, noPad }) {
  return (
    <div className="page">
      <Header title={title} sub={sub} right={right} back={back} onBack={onBack} />
      <div className={'scroll' + (footer ? '' : ' bottom-space')}>
        <div className={noPad ? '' : 'pad'}>{children}</div>
        {footer && <div style={{ height: 16 }} />}
      </div>
      {footer && <div className="sheet-foot">{footer}</div>}
    </div>
  );
}

export function Sheet({ open, onClose, title, children, footer, right, full }) {
  useBack(() => onClose?.(), open);
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onClose?.()} />
          <motion.div className="sheet" style={full ? { height: '92%' } : null}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} dragListener={false}>
            <div className="grab" />
            <div className="sheet-head">
              <h2>{title}</h2>
              {right}
              <button className="icon-btn" onClick={() => { fx('tap'); onClose?.(); }} aria-label="Tutup"><X size={22} /></button>
            </div>
            <div className="sheet-body">{children}</div>
            {footer && <div className="sheet-foot">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function DialogHost() {
  const d = useUI(s => s.dialog);
  const close = v => { fx(v ? 'tap' : 'tap'); useUI.getState().closeDialog(v); };
  useBack(() => close(false), !!d);
  const Icon = d?.icon || (d?.danger ? AlertTriangle : Info);
  return (
    <AnimatePresence>
      {d && (
        <>
          <motion.div className="backdrop" style={{ zIndex: 59 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => close(false)} />
          <div className="dialog-wrap" onClick={() => close(false)}>
            <motion.div className="dialog" onClick={e => e.stopPropagation()} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 380 }}>
              <div className="icon-circle" style={{ background: d.danger ? 'var(--expense-soft)' : 'var(--primary-soft)', color: d.danger ? 'var(--expense)' : 'var(--primary)' }}><Icon size={30} /></div>
              <h3>{d.title}</h3>
              {d.message && <p>{d.message}</p>}
              <div className="col gap8">
                <button className={'btn block ' + (d.danger ? 'danger' : 'primary')} onClick={() => close(true)}>{d.ok || 'Ya'}</button>
                {d.cancel !== false && <button className="btn block ghost" onClick={() => close(false)}>{d.cancel || 'Batal'}</button>}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ToastHost() {
  const toasts = useUI(s => s.toasts);
  const tab = useUI(s => s.tab); const stack = useUI(s => s.stack);
  const low = stack.length > 0 || tab === 'cashier';
  return (
    <div className="toast-wrap" style={low ? { bottom: 'calc(var(--safe-bottom) + 96px)' } : null}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} className="toast" initial={{ y: 30, opacity: 0, scale: .95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }} layout>
            {t.type === 'error' ? <AlertTriangle size={20} color="#FF8A7A" /> : <Check size={20} color="#5EE3A0" />}
            <span className="grow">{t.msg}</span>
            {t.action && <button onClick={() => { t.action.fn(); useUI.getState().dismissToast(t.id); }}>{t.action.label}</button>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export const Toggle = ({ on, onChange }) => (
  <button className={'toggle' + (on ? ' on' : '')} onClick={e => { e.stopPropagation(); fx('toggle'); onChange(!on); }} aria-pressed={on} />
);

export function Seg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => { fx('tap'); onChange(o.value); }}>{o.label}</button>
      ))}
    </div>
  );
}

export const Field = ({ label, children, hint }) => (
  <div className="field">
    {label && <label>{label}</label>}
    {children}
    {hint && <div className="tiny muted" style={{ paddingLeft: 2 }}>{hint}</div>}
  </div>
);

export function MoneyInput({ value, onChange, autoFocus, placeholder = '0', big }) {
  return (
    <div className="input-wrap">
      <span className="prefix" style={big ? { fontSize: '1.2rem' } : null}>Rp</span>
      <input className="input num" inputMode="numeric" autoFocus={autoFocus} placeholder={placeholder}
        style={big ? { height: 64, fontSize: '1.5rem', fontWeight: 800, paddingLeft: 54 } : null}
        value={value ? fmtInput(value) : ''} onChange={e => onChange(parseNum(e.target.value))} />
    </div>
  );
}

export function NumInput({ value, onChange, ...rest }) {
  return <input className="input num" inputMode="numeric" value={value ?? ''} onChange={e => { const v = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'); onChange(v); }} {...rest} />;
}

export const Empty = ({ art: Art, title, text, action }) => (
  <div className="empty">
    {Art && <Art />}
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {action}
  </div>
);

export const IconTile = ({ icon: Icon, color = 'var(--primary)', bg = 'var(--primary-soft)', size = 22, emoji }) => (
  <div className="ic" style={{ background: bg, color }}>{emoji ? <span style={{ fontSize: 22 }}>{emoji}</span> : <Icon size={size} />}</div>
);

// ---------- PIN pad ----------
export function PinPad({ title, sub, length = 4, onDone, error, footer, onCancel }) {
  const [v, setV] = useState('');
  const [shake, setShake] = useState(0);
  useEffect(() => { if (error) { setShake(x => x + 1); setV(''); } }, [error?.n]);
  const press = d => {
    fx('key');
    if (d === 'del') return setV(x => x.slice(0, -1));
    setV(x => {
      const n = (x + d).slice(0, length);
      if (n.length === length) setTimeout(() => onDone(n), 120);
      return n;
    });
  };
  return (
    <div className="col" style={{ alignItems: 'center', flex: 1 }}>
      <div className="icon-circle" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', marginTop: 8 }}><Lock size={30} /></div>
      <h2 style={{ margin: '16px 0 4px', fontSize: '1.3rem', fontWeight: 800 }}>{title}</h2>
      <div className="muted small" style={{ minHeight: 20, textAlign: 'center', color: error ? 'var(--expense)' : undefined, fontWeight: error ? 700 : 500 }}>{error?.msg || sub}</div>
      <motion.div key={shake} animate={shake ? { x: [0, -14, 14, -10, 10, -4, 0] } : {}} transition={{ duration: 0.4 }} className="row" style={{ gap: 18, margin: '26px 0 30px' }}>
        {Array.from({ length }).map((_, i) => (
          <motion.div key={i} animate={{ scale: i < v.length ? 1.15 : 1 }} style={{ width: 18, height: 18, borderRadius: 9, background: i < v.length ? 'var(--primary)' : 'transparent', border: '2.5px solid ' + (i < v.length ? 'var(--primary)' : 'var(--line)') }} />
        ))}
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 84px)', gap: 14 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', '0', 'del'].map(k => k === 'x'
          ? (onCancel ? <button key={k} onClick={onCancel} style={{ height: 72, fontWeight: 700, color: 'var(--muted)' }}>Batal</button> : <div key={k} />)
          : <button key={k} onClick={() => press(k)} style={{ height: 72, borderRadius: 24, background: k === 'del' ? 'transparent' : 'var(--surface)', boxShadow: k === 'del' ? 'none' : 'var(--shadow)', fontSize: '1.6rem', fontWeight: 700, display: 'grid', placeItems: 'center' }} className="keypad-btn">
            {k === 'del' ? <Delete size={26} /> : k}
          </button>)}
      </div>
      {footer}
    </div>
  );
}

export function PinHost() {
  const req = useUI(s => s.pinReq);
  const s = useStore(st => st.settings);
  const [err, setErr] = useState(null);
  const [recover, setRecover] = useState(false);
  const [ans, setAns] = useState('');
  useEffect(() => { if (req) { setErr(null); setRecover(false); setAns(''); } }, [req]);
  useBack(() => useUI.getState().finishPin(false), !!req);
  const check = async p => {
    if ((await hashPin(p)) === s.pin) { fx('unlock'); useUI.getState().finishPin(true); }
    else { fx('error'); setErr(e => ({ msg: 'PIN salah, coba lagi', n: (e?.n || 0) + 1 })); }
  };
  const tryRecover = async () => {
    if (s.pinA && (await hashPin(ans)) === s.pinA) {
      useStore.getState().setSettings({ pin: null, pinA: null, pinQ: '' });
      fx('success'); useUI.getState().finishPin(true);
      useUI.getState().toast('PIN dihapus. Silakan buat PIN baru di menu Keamanan.');
    } else { fx('error'); useUI.getState().toast('Jawaban tidak cocok', { type: 'error' }); }
  };
  return (
    <AnimatePresence>
      {req && (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'var(--bg)', display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) + 40px)', paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}>
          {!recover ? (
            <PinPad title={req.title} sub="Bagian ini dilindungi PIN" error={err} onDone={check} onCancel={req.noCancel ? null : () => useUI.getState().finishPin(false)}
              footer={s.pinQ ? <button className="btn ghost mt16" onClick={() => setRecover(true)}><KeyRound size={18} /> Lupa PIN?</button> : null} />
          ) : (
            <div className="pad col" style={{ flex: 1 }}>
              <div className="icon-circle" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', margin: '8px auto 0' }}><KeyRound size={30} /></div>
              <h2 style={{ textAlign: 'center', margin: '16px 0 6px', fontWeight: 800 }}>Lupa PIN</h2>
              <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>Jawab pertanyaan pemulihan untuk menghapus PIN.</p>
              <div className="card mt12">
                <div className="bold">{s.pinQ}</div>
                <input className="input mt12" autoFocus value={ans} onChange={e => setAns(e.target.value)} placeholder="Jawaban Anda" />
              </div>
              <button className="btn primary block mt16" onClick={tryRecover} disabled={!ans.trim()}>Periksa jawaban</button>
              <button className="btn ghost block mt8" onClick={() => setRecover(false)}>Kembali ke PIN</button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- receipt preview ----------
export function ReceiptPaper({ blocks, onCanvas, settingsOverride }) {
  const s0 = useStore(st => st.settings); const logo = useStore(st => st.logo);
  const s = settingsOverride || s0;
  const [url, setUrl] = useState(null);
  const ref = useRef(0);
  const key = JSON.stringify(blocks) + s.paper + s.logoWidth + s.logoMode + s.logoDark + (logo ? logo.length : 0);
  useLayoutEffect(() => {
    const id = ++ref.current;
    (async () => {
      const imgs = await prepareImages(blocks, s, logo);
      const c = await renderReceiptCanvas(blocks, imgs, s, 2);
      if (id !== ref.current) return;
      setUrl(c.toDataURL('image/png'));
      onCanvas?.(c);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <div className="paper-wrap">
      <div className={'paper' + (s.paper === 80 ? ' wide' : '')}>
        {url ? <img src={url} alt="Struk" /> : <div style={{ height: 320 }} />}
      </div>
    </div>
  );
}
