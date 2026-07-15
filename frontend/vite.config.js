import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Merge .env files + process.env so Vercel project env vars are inlined too.
  // loadEnv alone only reads files and misses dashboard-injected secrets.
  const fileEnv = loadEnv(mode, process.cwd(), 'REACT_APP_');
  const env = { ...fileEnv };
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('REACT_APP_') && v != null && v !== '') {
      env[k] = v;
    }
  }
  const define = Object.fromEntries(
    Object.entries(env).map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)])
  );
  // Production default: same-origin /api (proxied by vercel.json → Cloud Run).
  // Avoid baking localhost into the live bundle when the env var is unset.
  if (mode === 'production' && (env.REACT_APP_BACKEND_URL == null || env.REACT_APP_BACKEND_URL === '')) {
    define['process.env.REACT_APP_BACKEND_URL'] = JSON.stringify('');
  }
  define['process.env.NODE_ENV'] = JSON.stringify(mode === 'production' ? 'production' : mode);

  return {
  // Expose CRA-style REACT_APP_* vars to the client bundle (used by api.jsx).
  envPrefix: ['VITE_', 'REACT_APP_'],
  define,
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
};
});
