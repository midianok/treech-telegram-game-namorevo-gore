import { defineConfig } from 'vite';

import { namorevoGoreApiMockPlugin } from './vite.namorevoGoreApiMock';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/treech-telegram-game-namorevo-gore/',
  plugins: [namorevoGoreApiMockPlugin()],
  server: {
    allowedHosts: true,
    open: false,
    proxy: {
      '/saturn-api': {
        target: 'http://localhost:5001',
        rewrite: (path) => path.replace(/^\/saturn-api/, ''),
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
  },
});
