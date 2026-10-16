// Vite builds the React app from app/web into dist/, which the Node server serves.
// `npm run dev` gives hot reload on port 5173 and forwards /api to the server on port 3000.
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./app/web', import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
});
