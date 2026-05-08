import { defineConfig } from 'vite';

export default defineConfig({
  base: '/namorevo-gore/',
  server: {
    open: false,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
  },
});
