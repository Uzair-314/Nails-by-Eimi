/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        wine: {
          DEFAULT: '#8B4550',
          50: '#FBF3F3',
          100: '#F6E6E7',
          200: '#EBCBCE',
          300: '#DBA5AB',
          400: '#C07B85',
          500: '#A15A66',
          600: '#8B4550',
          700: '#743A43',
          800: '#5C2F36',
          900: '#422227',
        },
        blush: '#FBF4F3',
        canvas: '#FDFAF9',
        ink: '#3A2A2F',
        muted: '#8A7378',
        rose: '#B08A90',
        line: '#F0E4E2',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '16px' },
      boxShadow: {
        card: '0 1px 2px rgba(58,42,47,0.04), 0 8px 24px -16px rgba(58,42,47,0.18)',
        lift: '0 12px 40px -18px rgba(58,42,47,0.32)',
        drawer: '0 0 60px rgba(58,42,47,0.22)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up .45s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in .3s ease both',
      },
    },
  },
  plugins: [],
}
