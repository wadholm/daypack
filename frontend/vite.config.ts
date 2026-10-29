import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import pandacss from '@pandacss/vite';

// pandacss() must come before the framework plugin.
export default defineConfig({
  plugins: [pandacss(), preact()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
