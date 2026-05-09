import { defineConfig } from 'vite';

export default defineConfig({
  base: '/namorevo-gore/',
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
