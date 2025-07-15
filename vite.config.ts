import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    hmr: {
      port: 443
    },
    allowedHosts: [
      '.replit.dev',
      '.replit.co',
      'localhost',
      '127.0.0.1'
    ]
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [
        '@supabase/postgrest-js',
        '@supabase/storage-js', 
        '@supabase/realtime-js',
        '@supabase/gotrue-js'
      ]
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
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    exclude: ['@supabase/postgrest-js', '@supabase/storage-js', '@supabase/realtime-js', '@supabase/gotrue-js']
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