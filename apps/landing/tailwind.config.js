/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#030817',
        },
        greenlogix: {
          ink: '#030817',
          surface: '#08101f',
          panel: '#111a2c',
          lime: '#ffd400',
          mint: '#36d9a5',
          sage: '#83c5a8',
          ivory: '#f8fafc',
        },
        ecomiles: {
          ink: '#030817',
          surface: '#08101f',
          panel: '#111a2c',
          lime: '#ffd400',
          mint: '#36d9a5',
          sage: '#83c5a8',
          ivory: '#f8fafc',
        },
        cargox: {
          dark: '#030817',
          yellow: '#ffd400',
          fallback: '#08101f',
          mobileMenu: '#111a2c',
          brandGreen: '#36d9a5',
        },
      },
      boxShadow: {
        'lime-glow': '0 16px 48px rgba(255, 212, 0, 0.18)',
        'panel': '0 24px 80px rgba(0, 3, 15, 0.48)',
      },
      fontFamily: {
        barlow: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
