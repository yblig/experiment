import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, ReceiptText, ShoppingBag, Wallet, LayoutGrid } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useStore } from './store.js';
import { useUI, toast } from './ui.js';
import { native } from './lib/native.js';
import { syncFx } from './lib/fx.js';
import { DialogHost, ToastHost, PinHost } from './components/ui.jsx';
import Home from './screens/Home.jsx';
import Cashier from './screens/Cashier.jsx';
import Payment from './screens/Payment.jsx';
import { History, SaleDetail, SaleDone } from './screens/Sales.jsx';
import Finance from './screens/Finance.jsx';
import Menu from './screens/Menu.jsx';
import { Products, Categories } from './screens/Products.jsx';
import { Customers, CustomerDetail, Debts } from './screens/Customers.jsx';
import Reports from './screens/Reports.jsx';
import ReceiptSettings from './screens/ReceiptSettings.jsx';
import Printer from './screens/Printer.jsx';
import { Security, Appearance, Backup, About, CashierSettings } from './screens/Settings.jsx';
import Onboarding from './screens/Onboarding.jsx';

const PAGES = {
  payment: Payment, done: SaleDone, sale: SaleDetail, products: Products, categories: Categories,
  customers: Customers, customer: CustomerDetail, debts: Debts, reports: Reports, receiptSettings: ReceiptSettings,
  printer: Printer, security: Security, appearance: Appearance, backup: Backup, about: About, cashierSettings: CashierSettings
};
const TABS = { home: Home, history: History, cashier: Cashier, finance: Finance, menu: Menu };

function useTheme() {
  const theme = useStore(s => s.settings.theme); const big = useStore(s => s.settings.bigText);
  const sound = useStore(s => s.settings.sound); const hap = useStore(s => s.settings.haptics);
  const [sysDark, setSysDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-color-scheme: dark)'); if (!m) return;
    const f = e => setSysDark(e.matches); m.addEventListener?.('change', f); return () => m.removeEventListener?.('change', f);
  }, []);
  const dark = theme === 'dark' || (theme === 'system' && sysDark);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.big = big ? '1' : '0';
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0F1312' : '#F4F2ED');
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor?.({ color: dark ? '#0F1312' : '#F4F2ED' }).catch(() => {});
    }
  }, [dark, big]);
  useEffect(() => { syncFx(); }, [sound, hap]);
}

function TabBar() {
  const tab = useUI(s => s.tab);
  const cartCount = useStore(s => s.cart.items.reduce((a, i) => a + i.qty, 0));
  const go = async t => {
    if (t === 'finance') { const ok = await useUI.getState().requirePin('finance', 'Buka Keuangan'); if (!ok) return; }
    useUI.getState().setTab(t);
  };
  const Item = ({ id, icon: Icon, label }) => (
    <button className={'tab' + (tab === id ? ' on' : '')} onClick={() => go(id)}>
      {tab === id && <motion.div layoutId="tabpill" className="pill" transition={{ type: 'spring', damping: 26, stiffness: 400 }} />}
      <Icon size={23} strokeWidth={tab === id ? 2.4 : 2} />
      {label}
    </button>
  );
  return (
    <div className="tabbar">
      <Item id="home" icon={HomeIcon} label="Beranda" />
      <Item id="history" icon={ReceiptText} label="Riwayat" />
      <div className="tab-center">
        <button onClick={() => go('cashier')} style={tab === 'cashier' ? { filter: 'brightness(1.08)' } : null}>
          <ShoppingBag size={24} />Kasir
          {cartCount > 0 && <span className="badge" style={{ position: 'absolute', marginLeft: 44, marginTop: -44, background: 'var(--accent)', color: '#3A2600', border: '2px solid var(--bg)' }}>{cartCount}</span>}
        </button>
      </div>
      <Item id="finance" icon={Wallet} label="Keuangan" />
      <Item id="menu" icon={LayoutGrid} label="Menu" />
    </div>
  );
}

export default function App() {
  useTheme();
  const onboarded = useStore(s => s.settings.onboarded);
  const tab = useUI(s => s.tab);
  const stack = useUI(s => s.stack);
  const [appLocked, setAppLocked] = useState(() => { const s = useStore.getState().settings; return !!(s.pin && s.lock.app); });

  useEffect(() => {
    native.toast = () => toast('Tekan sekali lagi untuk keluar');
    const off = native.onBack(() => {
      const u = useUI.getState();
      if (u.stack.length) { u.pop(); return true; }
      if (u.tab !== 'home') { u.setTab('home'); return true; }
      return false;
    });
    native.onPause(() => {
      useUI.getState().lock();
      const s = useStore.getState().settings;
      if (s.pin && s.lock.app) setAppLocked(true);
    });
    // base handler must run last: move it to the bottom of the stack
    return off;
  }, []);

  useEffect(() => {
    if (!appLocked) return;
    useUI.setState({ pinReq: { title: 'Buka StrukKu', noCancel: true, resolve: ok => { if (ok) setAppLocked(false); } } });
  }, [appLocked]);

  if (!onboarded) return <><Onboarding /><DialogHost /><ToastHost /></>;

  const TabC = TABS[tab];
  return (
    <div className="shell">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={tab} className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <TabC />
        </motion.div>
      </AnimatePresence>
      {tab !== 'cashier' && <TabBar />}
      <AnimatePresence initial={false}>
        {stack.map((p, i) => {
          const C = PAGES[p.name];
          return (
            <motion.div key={p.id} className="page" style={{ zIndex: 30 + i, boxShadow: '-10px 0 30px rgba(0,0,0,.08)' }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 34, stiffness: 360 }}>
              {C ? <C {...p.props} /> : null}
            </motion.div>
          );
        })}
      </AnimatePresence>
      <DialogHost />
      <PinHost />
      <ToastHost />
    </div>
  );
}
