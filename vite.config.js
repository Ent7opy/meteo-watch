import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy /api calls to the local Vercel dev server when running `vite` directly.
    // When using `vercel dev`, this proxy is not needed — Vercel handles routing.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
