import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: './',               // relative paths: required inside the Android WebView
  plugins: [react()],
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 4000 },
  server: { host: true }
});
