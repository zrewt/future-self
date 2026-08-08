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
        // ── Light mode primary: vibrant purple ──
        primary: {
          DEFAULT: '#7F5AF0',
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7F5AF0',
          600: '#6D44E0',
          700: '#5B35C5',
          800: '#4A29A0',
          900: '#3B2080',
        },
        // ── Dark mode accent: electric green ──
        green: {
          DEFAULT: '#00E87A',
          dim:     '#00C466',
          bright:  '#1AFF8C',
        },
        // ── Semantic / pillar colors ──
        teal:   '#00E87A',   // reused as green in dark
        coral:  '#FF5C5C',   // error / negative / longevity
        amber:  '#FFB830',   // streaks / warnings / focus
        blue:   '#4DA6FF',   // energy / information
        pink:   '#EC4B99',   // passion / longevity accent
        // ── Pillar-specific ──
        pillar: {
          nutrition: '#00E87A',
          fitness:   '#7F5AF0',
          energy:    '#4DA6FF',
          focus:     '#FFB830',
          longevity: '#FF5C5C',
        },
        // ── Surfaces ──
        surface: {
          DEFAULT: '#FFFFFF',
          muted:   '#F5F7F2',
          border:  '#E2E6DC',
        },
        // ── Dark surfaces ──
        dark: {
          bg:       '#0A0D08',
          raised:   '#111509',
          card:     '#161C0F',
          elevated: '#1E2616',
          border:   'rgba(0,232,122,0.08)',
        },
      },
      boxShadow: {
        // Light mode
        card:           '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        'card-hover':   '0 4px 12px rgba(15,23,42,0.06), 0 20px 48px rgba(127,90,240,0.14), inset 0 1px 0 rgba(255,255,255,0.95)',
        dock:           '0 -4px 32px rgba(15,23,42,0.08), inset 0 0 0 1px rgba(255,255,255,0.8)',
        // Glows — light mode (purple)
        glow:           '0 0 32px rgba(127,90,240,0.45), 0 0 64px rgba(127,90,240,0.15)',
        'glow-sm':      '0 0 16px rgba(127,90,240,0.4)',
        // Glows — dark mode (green)
        'glow-green':   '0 0 32px rgba(0,232,122,0.45), 0 0 64px rgba(0,232,122,0.15)',
        'glow-green-sm':'0 0 16px rgba(0,232,122,0.4)',
        // Per-pillar glows
        'glow-blue':    '0 0 24px rgba(77,166,255,0.4)',
        'glow-amber':   '0 0 24px rgba(255,184,48,0.4)',
        'glow-coral':   '0 0 24px rgba(255,92,92,0.4)',
        // Dark card
        'card-dark':    'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.45)',
        'card-dark-hover': 'inset 0 1px 0 rgba(0,232,122,0.12), 0 0 0 1px rgba(0,232,122,0.2), 0 12px 40px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
        'glow-pulse-green': 'glowPulseGreen 3s ease-in-out infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
        'flame':        'flame 1.8s ease infinite',
        'xp-dot':       'xpDot 2s ease infinite',
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
          '0%,100%': { boxShadow: '0 0 20px rgba(127,90,240,0.3)' },
          '50%':     { boxShadow: '0 0 50px rgba(127,90,240,0.6)' },
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
          '0%,100%': { boxShadow: '0 0 8px rgba(127,90,240,0.8)' },
          '50%':     { boxShadow: '0 0 20px rgba(127,90,240,1), 0 0 40px rgba(127,90,240,0.5)' },
        },
      },
    },
  },
  plugins: [],
}