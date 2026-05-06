import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        glass: '0 24px 80px rgba(15, 23, 42, 0.14)',
        soft: '0 12px 40px rgba(15, 23, 42, 0.08)',
        lift: '0 18px 60px rgba(37, 99, 235, 0.16)',
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'doctor-glow': 'radial-gradient(circle at top left, rgba(37,99,235,0.24), transparent 32%), radial-gradient(circle at top right, rgba(14,165,233,0.18), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.88), rgba(248,250,252,0.64))',
        'careos-hero': 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.92)), radial-gradient(circle at top right, rgba(96,165,250,0.55), transparent 34%)',
      },
    },
  },
  plugins: [],
} satisfies Config
