
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: false,
    hmr: {
      port: 5173,
      clientPort: 5173
    },
    cors: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  esbuild: {
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    },
    target: 'es2020',
    keepNames: true
  },
  base: './',
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js']
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    process: {
      env: {},
      cwd: () => '/',
      nextTick: (fn) => setTimeout(fn, 0),
      browser: true
    }
  }
})
