import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/800.css';
import './theme.css';
import { storage } from './lib/storage.js';
import { native } from './lib/native.js';
import { useStore, startPersist } from './store.js';
import { loadSounds, syncFx } from './lib/fx.js';
import { autoConnect } from './lib/printer.js';
import App from './App.jsx';

(async () => {
  await storage.init();
  useStore.getState().hydrate();
  startPersist();
  syncFx();
  await native.init();
  createRoot(document.getElementById('app')).render(<App />);
  loadSounds();
  setTimeout(() => { native.hideSplash(); autoConnect(); }, 300);
  if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  window.__store = useStore;
  window.__ui = (await import('./ui.js')).useUI;
})();
