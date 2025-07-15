import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react({
    // Riduce errori di refresh
    fastRefresh: true,
    babel: {
      parserOpts: {
        plugins: ['decorators-legacy']
      }
    }
  })],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: ['.replit.dev'],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    // Ottimizzazioni per ridurre errori console
    hmr: {
      overlay: false
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
    rollupOptions: {
      onwarn: (warning, warn) => {
        // Silenzia warning non critici
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  },
  esbuild: {
    // Riduce errori di parsing
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    }
  },
  base: './',
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@supabase/supabase-js']
  },
  // Riduce errori di sviluppo
  define: {
    global: 'globalThis'
  }
})