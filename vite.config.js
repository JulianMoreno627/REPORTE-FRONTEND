import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173 },
  worker: { format: 'es' },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { leaflet: ['leaflet', 'leaflet.markercluster', 'leaflet.heat'], react: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
});
