import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// "host: true" expose le serveur de dev sur le reseau local (0.0.0.0),
// indispensable pour que les smartphones puissent y acceder via l'IP du PC.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});
