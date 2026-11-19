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
        n8n: {
          50: '#fff5f4',
          100: '#ffe8e5',
          200: '#ffd5cf',
          300: '#ffb3a7',
          400: '#ff8a78',
          500: '#ff6d5a', // n8n signature coral
          600: '#ea4b35',
          700: '#c53824',
          800: '#a33020',
          900: '#872c1f',
          950: '#4a130b',
        },
        canvas: {
          bg: '#0c0e14',
          surface: '#12151e',
          card: '#161925',
          hover: '#1c2130',
          border: '#242a3d',
          node: '#1a1e2d',
        },
        slate: {
          950: '#070a13',
          900: '#0b1120',
          850: '#0f172a',
          800: '#1e293b',
          750: '#283548',
          700: '#334155',
          600: '#475569'
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow': 'glow 2.5s ease-in-out infinite alternate',
        'flow': 'flow 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(255, 109, 90, 0.2)' },
          '100%': { boxShadow: '0 0 35px rgba(255, 109, 90, 0.5)' },
        },
        flow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        }
      }
    },
  },
  plugins: [],
}
