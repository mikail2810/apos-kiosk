import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Pashanim Design Tokens
        brand: {
          bg:       '#0F1F0F',   // tiefstes Grün – App-Hintergrund
          surface:  '#1A2E1A',   // Karten & Surfaces
          border:   '#2A422A',   // Trennlinien
          muted:    '#3D5C3D',   // dezente Elemente
          accent:   '#FF6B2B',   // Orange – CTA, Preise
          'accent-hover': '#FF8A52',
          text:     '#F5F0E8',   // Off-White
          'text-muted': '#9AB09A',
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      }
    }
  },
  plugins: []
} satisfies Config
