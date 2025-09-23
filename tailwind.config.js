/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nuovi colori tema light
        'app-bg': 'var(--bg)',
        'app-text': 'var(--text)',
        'app-surface': 'var(--surface)',
        'app-surface-2': 'var(--surface-2)',
        'app-surface-hover': 'var(--surface-hover)',
        'app-border': 'var(--border)',
        'app-muted': 'var(--muted)',
        'app-muted-text': 'var(--muted-text)',
        'app-toolbar-bg': 'var(--toolbar-bg)',
        'app-accent': 'var(--accent)',
        'app-danger': 'var(--danger)',
        'app-warn': 'var(--warn)',
        'app-icon': 'var(--icon)',
        // Colori legacy mantenuti per compatibilità
        cream: '#F5F5DC',
        'wine-red': '#722F37',
        'wine-dark': '#2D1B1E'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      }
    },
  },
  plugins: [],
  important: true, // Per risolvere conflitti CSS
}