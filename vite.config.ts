
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Icons from 'unplugin-icons/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    Icons({
      // Configurazione unplugin-icons
      compiler: 'jsx',
      jsx: 'react',
      defaultStyle: 'display: inline-block;',
      defaultClass: 'icon',
      scale: 1,
      autoInstall: true
    }),
    // Bundle analyzer - solo quando richiesto esplicitamente
    process.env.ANALYZE && visualizer({
      filename: 'artifacts/bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap' // treemap, sunburst, network
    })
  ].filter(Boolean),
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
      external: ['google-auth-library', 'gcp-metadata', 'child_process', 'fs', 'os', 'path'],
      output: {
        manualChunks: {
          // Vendor chunks stabili per caching ottimale
          'react-core': ['react', 'react-dom'],
          'supabase-core': ['@supabase/supabase-js'],
          'icons-core': ['lucide-react']
        }
      }
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
