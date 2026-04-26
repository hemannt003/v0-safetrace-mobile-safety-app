import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:    '#0D1B3E',
        danger:  '#E52D27',
        safe:    '#00966E',
        caution: '#E67E22',
        warning: '#F39C12',
        lime:    '#B8D92A',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        body:    ['var(--font-dm-sans)', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { transform: 'scale(1)',   opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'risk-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(229,45,39,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(229,45,39,0.7)' },
        },
        'slide-up': {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to':   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      animation: {
        'pulse-ring-1': 'pulse-ring 2s ease-out infinite',
        'pulse-ring-2': 'pulse-ring 2s ease-out 0.4s infinite',
        'pulse-ring-3': 'pulse-ring 2s ease-out 0.8s infinite',
        'risk-glow':    'risk-glow 1.5s ease-in-out infinite',
        'slide-up':     'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
