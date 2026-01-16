import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

export default defineConfig({
  plugins: [uni()],
  server: {
    port: 3001,
    open: false,
  },
});
