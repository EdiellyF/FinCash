/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fincash: {
          forest: '#1B4332',
          cream: '#F7F3E9',
          gold: '#D4A24C',
          terracotta: '#8B3A3A',
          ink: '#2D2A26',
        },
      },
      fontFamily: {
        sans: ['Work Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    }
  },
  plugins: []
};
