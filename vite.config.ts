
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 3000,
    open: true,
    cors: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@orders': '/src/features/orders'
    }
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
    include: ['react', 'react-dom', '@supabase/supabase-js', 'react-router-dom', 'react-router']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['google-auth-library', 'gcp-metadata', 'child_process', 'fs', 'os', 'path']
    },
    commonjsOptions: {
      include: [/node_modules/]
    }
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
