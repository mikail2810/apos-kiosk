import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: ['hover:bg-brand-surface-2', 'active:bg-brand-muted'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        brand: {
          bg:           '#080E08',
          surface:      '#111A11',
          'surface-2':  '#182418',
          border:       '#1E2E1E',
          'border-2':   '#253525',
          muted:        '#2E452E',
          accent:       '#FF6B2B',
          'accent-hover':'#FF8A52',
          'accent-dim': '#FF6B2B33',
          text:         '#F0EDE6',
          'text-muted': '#7A9A7A',
          'text-faint': '#4A6A4A',
          success:      '#4ADE80',
          warning:      '#FBBF24',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        fadeIn:  'fadeIn 0.4s ease-out',
        slideUp: 'slideUp 0.5s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
