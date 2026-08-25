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
          DEFAULT: '#6D5CE7',
          50:  '#F4F3FE',
          100: '#EAE7FC',
          200: '#D6D0F9',
          300: '#B7ACF3',
          400: '#9384EC',
          500: '#6D5CE7',
          600: '#5A48D6',
          700: '#4A3AB8',
          800: '#3D2F94',
          900: '#322774',
        },
        green: {
          DEFAULT: '#00E87A',
          dim:     '#00C466',
          bright:  '#1AFF8C',
        },
        teal:   '#00E87A',
        coral:  '#FF5C5C',
        amber:  '#FFB830',
        blue:   '#4DA6FF',
        pink:   '#EC4B99',
        pillar: {
          nutrition: '#00E87A',
          fitness:   '#6D5CE7',
          energy:    '#4DA6FF',
          focus:     '#FFB830',
          longevity: '#FF5C5C',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted:   '#F5F7F2',
          border:  '#E2E6DC',
        },
        dark: {
          bg:       '#0A0D08',
          raised:   '#111509',
          card:     '#161C0F',
          elevated: '#1E2616',
          border:   'rgba(0,232,122,0.08)',
        },
      },
      boxShadow: {
        card:           '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        'card-hover':   '0 4px 12px rgba(15,23,42,0.06), 0 20px 48px rgba(109,92,231,0.14), inset 0 1px 0 rgba(255,255,255,0.95)',
        dock:           '0 -4px 32px rgba(15,23,42,0.08), inset 0 0 0 1px rgba(255,255,255,0.8)',
        glow:           '0 0 32px rgba(109,92,231,0.45), 0 0 64px rgba(109,92,231,0.15)',
        'glow-sm':      '0 0 16px rgba(109,92,231,0.4)',
        'glow-green':   '0 0 32px rgba(0,232,122,0.45), 0 0 64px rgba(0,232,122,0.15)',
        'glow-green-sm':'0 0 16px rgba(0,232,122,0.4)',
        'glow-blue':    '0 0 24px rgba(77,166,255,0.4)',
        'glow-amber':   '0 0 24px rgba(255,184,48,0.4)',
        'glow-coral':   '0 0 24px rgba(255,92,92,0.4)',
        'card-dark':    'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.45)',
        'card-dark-hover': 'inset 0 1px 0 rgba(0,232,122,0.12), 0 0 0 1px rgba(0,232,122,0.2), 0 12px 40px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        spring:      'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
        'glow-pulse-green': 'glowPulseGreen 3s ease-in-out infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
        'flame':        'flame 1.8s ease infinite',
        'xp-dot':       'xpDot 2s ease infinite',
        'pop-in':       'popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) backwards',
        'success-pop':  'successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'checkmark':    'checkmark 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 20px rgba(109,92,231,0.3)' },
          '50%':     { boxShadow: '0 0 50px rgba(109,92,231,0.6)' },
        },
        glowPulseGreen: {
          '0%,100%': { boxShadow: '0 0 20px rgba(0,232,122,0.3)' },
          '50%':     { boxShadow: '0 0 50px rgba(0,232,122,0.6)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        flame: {
          '0%,100%': { transform: 'scale(1) rotate(-2deg)', filter: 'drop-shadow(0 0 8px rgba(255,184,48,0.6))' },
          '50%':     { transform: 'scale(1.08) rotate(2deg)', filter: 'drop-shadow(0 0 18px rgba(255,184,48,0.9))' },
        },
        xpDot: {
          '0%,100%': { boxShadow: '0 0 8px rgba(109,92,231,0.8)' },
          '50%':     { boxShadow: '0 0 20px rgba(109,92,231,1), 0 0 40px rgba(109,92,231,0.5)' },
        },
        popIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        successPop: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        checkmark: {
          '0%':   { transform: 'scale(0.5) rotate(-10deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.15) rotate(4deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}