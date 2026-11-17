/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ecomiles: {
          cosmos: '#003049',
          gochujang: '#780000',
          crimson: '#C1121F',
          varden: '#FDF0D5',
          marble: '#669BBC',
          ok: '#15803D',
          warn: '#B45309',
          err: '#B91C1C',
          ink: '#003049',
          surface: '#FDF0D5',
          panel: '#003049',
          ivory: '#FDF0D5',
        },
      },
      boxShadow: {
        'crimson-glow': '0 16px 48px rgba(193, 18, 31, 0.22)',
        'panel': '0 24px 80px rgba(0, 48, 73, 0.35)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Be Vietnam Pro"', 'sans-serif'],
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
