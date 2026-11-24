import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import './theme.css';
import { createRoot } from 'react-dom/client';
import { storage } from './lib/storage.js';
import { native } from './lib/native.js';
import { useStore } from './store.js';
import { loadSounds } from './fx.js';
import { toast } from './components/ui.jsx';
import App from './App.jsx';

(async () => {
  await storage.init();
  await native.init();
  native.toast = () => toast('Tekan kembali sekali lagi untuk keluar');
  useStore.getState().load();
  createRoot(document.getElementById('app')).render(<App />);
  loadSounds();
  requestAnimationFrame(() => native.hideSplash());
})();
