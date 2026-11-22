import { createRoot } from 'react-dom/client';
import './theme.css';
import App from './App.jsx';
import { storage } from './lib/storage.js';
import { native } from './lib/native.js';
import { initSfx } from './sfx.js';
import { StatusBar, Style } from '@capacitor/status-bar';

(async () => {
  await storage.init();
  await native.init();
  try { await StatusBar.setStyle({ style: Style.Dark }); await StatusBar.setBackgroundColor({ color: '#0a0d12' }); } catch { /* web */ }
  initSfx();
  createRoot(document.getElementById('app')).render(<App />);
})();
