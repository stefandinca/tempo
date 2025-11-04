// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    base: '/tempo/vite/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'dashboard.html'),
        login: resolve(__dirname, 'select-user.html'),
      },
    },
    outDir: 'dist', // This is the default, but good to be explicit
    minify: 'terser', // This ensures minification
  },
});