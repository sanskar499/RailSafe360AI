/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        railway: {
          blue: {
            DEFAULT: '#0B3C5D',
            dark: '#072a43',
            light: '#328cc1',
            muted: '#1d2731',
          },
          gold: {
            DEFAULT: '#D9B310',
            dark: '#b5920a',
            light: '#fad126'
          },
          steel: {
            DEFAULT: '#4b5563',
            light: '#9ca3af',
            dark: '#1f2937'
          },
          accent: {
            red: '#e11d48',
            green: '#16a34a',
            yellow: '#ca8a04'
          }
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.47)'
      }
    },
  },
  plugins: [],
}
