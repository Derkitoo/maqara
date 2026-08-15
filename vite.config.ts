import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/maqara/',
  plugins: [react()],
  server: {
    port: 5173,
  },
});
