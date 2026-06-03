/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#7F77DD',
          50: '#F4F3FC',
          100: '#E8E6F8',
          200: '#D1CCF1',
          300: '#B3ABE8',
          400: '#9A91E0',
          500: '#7F77DD',
          600: '#6B63C9',
          700: '#5650A8',
          800: '#454088',
          900: '#38356E',
        },
        teal: '#1D9E75',
        amber: '#EF9F27',
        coral: '#D85A30',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8F9FC',
          border: '#E8EAEF',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.06), 0 16px 40px rgba(127, 119, 221, 0.12)',
        dock: '0 -4px 32px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(255,255,255,0.8) inset',
        glow: '0 0 40px rgba(127, 119, 221, 0.35)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
