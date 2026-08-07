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
          DEFAULT: '#A855F7',
          50:  '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
        },
        // Per-pillar colors from the style kit
        pillar: {
          nutrition: '#22C55E',   // energy green
          fitness:   '#A855F7',   // vibrant purple
          energy:    '#3B82F6',   // focus blue
          focus:     '#F97316',   // vitality orange
          longevity: '#EC4B99',   // passion pink
        },
        teal:  '#22C55E',   // maps to energy green in kit
        amber: '#F97316',
        coral: '#EC4B99',
        violet: '#A855F7',
        blue:   '#3B82F6',
        surface: {
          DEFAULT: '#FFFFFF',
          muted:   '#F8F9FC',
          border:  '#E8EAEF',
        },
        dark: {
          bg:      '#0B0D12',
          surface: '#11151C',
          card:    '#161B26',
          border:  'rgba(255,255,255,0.08)',
        },
      },
      boxShadow: {
        // Layered card shadows with subtle color
        card:       '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06), 0 1px 0 rgba(255,255,255,0.8) inset',
        'card-hover':'0 4px 12px rgba(15,23,42,0.06), 0 20px 48px rgba(168,85,247,0.14), 0 1px 0 rgba(255,255,255,0.9) inset',
        'card-dark': '0 0 0 1px rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.4)',
        'card-dark-hover': '0 0 0 1px rgba(168,85,247,0.3) inset, 0 8px 40px rgba(168,85,247,0.15), 0 20px 60px rgba(0,0,0,0.5)',
        dock:       '0 -4px 32px rgba(15,23,42,0.08), 0 0 0 1px rgba(255,255,255,0.8) inset',
        // Colored glows per pillar
        glow:       '0 0 40px rgba(168,85,247,0.4)',
        'glow-green':  '0 0 32px rgba(34,197,94,0.35)',
        'glow-blue':   '0 0 32px rgba(59,130,246,0.35)',
        'glow-orange': '0 0 32px rgba(249,115,22,0.35)',
        'glow-pink':   '0 0 32px rgba(236,75,153,0.35)',
        // Inner highlight for glass morphism
        inner: 'inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      backgroundImage: {
        // Gradient buttons
        'btn-primary':   'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
        'btn-dark':      'linear-gradient(135deg, #22C55E 0%, #A855F7 100%)',
        // Score ring gradient
        'ring-gradient': 'conic-gradient(from 180deg, #A855F7, #22C55E, #3B82F6)',
        // Card shimmer
        'card-shimmer':  'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(168,85,247,0.3)' },
          '50%':      { boxShadow: '0 0 50px rgba(168,85,247,0.6)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
      },
    },
  },
  plugins: [],
}