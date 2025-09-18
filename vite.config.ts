import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`Proxying ${req.method} ${req.url} to target`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`Received ${proxyRes.statusCode} for ${req.url}`);
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react'],
          transformers: ['@xenova/transformers']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@xenova/transformers'],
    exclude: ['lucide-react']
  },
});