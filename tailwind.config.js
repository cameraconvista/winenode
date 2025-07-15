/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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