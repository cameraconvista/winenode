
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: false,
    hmr: {
      port: 443,
      clientPort: 443
    },
    allowedHosts: 'all',
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
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
