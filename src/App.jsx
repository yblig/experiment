import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessagesSquare, Sparkles, Settings as Cog, Plus } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useStore } from './store.js';
import { ToastHost, useBack } from './components/ui.jsx';
import { fx } from './fx.js';
import Home from './screens/Home.jsx';
import Presets from './screens/Presets.jsx';
import Settings from './screens/Settings.jsx';
import Editor from './screens/Editor.jsx';
import NewChatSheet from './screens/NewChatSheet.jsx';

function useTheme() {
  const pref = useStore(s => s.settings.theme);
  const [sys, setSys] = useState(() => matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)');
    const f = () => setSys(mq.matches ? 'light' : 'dark');
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  const theme = pref === 'system' ? sys : pref;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.style.background = theme === 'light' ? '#f5f6fb' : '#0f1117';
    if (Capacitor.isNativePlatform()) StatusBar.setStyle({ style: theme === 'light' ? Style.Light : Style.Dark }).catch(() => {});
  }, [theme]);
}

const TABS = [
  ['home', 'Chat Saya', MessagesSquare],
  ['presets', 'Preset', Sparkles],
  ['settings', 'Pengaturan', Cog]
];

export default function App() {
  useTheme();
  const [tab, setTab] = useState('home');
  const [editing, setEditing] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  useBack(!editing && tab !== 'home', () => setTab('home'));

  useEffect(() => {
    window.__app = { open: id => setEditing(id), tab: setTab, newChat: () => setNewOpen(true) };
  }, []);

  const open = id => { setEditing(id); setTab('home'); };
  const S = { home: Home, presets: Presets, settings: Settings }[tab];

  return (
    <>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={tab} className="screen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <S onOpen={open} onNew={() => setNewOpen(true)} goPresets={() => setTab('presets')} />
        </motion.div>
      </AnimatePresence>

      {tab === 'home' && (
        <motion.button className="fab press" whileTap={{ scale: 0.9 }} onClick={() => { fx.tap(); setNewOpen(true); }} aria-label="Chat baru"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
          <Plus size={28} strokeWidth={2.6} />
        </motion.button>
      )}

      <nav className="tabbar">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} className={'tab press' + (tab === k ? ' on' : '')} onClick={() => { fx.tap(); setTab(k); }}>
            <Icon size={22} strokeWidth={tab === k ? 2.4 : 2} />
            {label}
          </button>
        ))}
      </nav>

      <NewChatSheet open={newOpen} onClose={() => setNewOpen(false)} onCreated={id => { setNewOpen(false); setTab('home'); open(id); }} />

      <AnimatePresence>
        {editing && (
          <motion.div key="ed" className="screen" style={{ zIndex: 20 }} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}>
            <Editor id={editing} onClose={() => setEditing(null)} />
          </motion.div>
        )}
      </AnimatePresence>
      <ToastHost />
    </>
  );
}
