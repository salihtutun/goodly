import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Expose CRA-style REACT_APP_* vars to the client bundle (used by api.jsx).
  envPrefix: ['VITE_', 'REACT_APP_'],
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.jsx', '.js', '.json'],
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
});
