/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'mars-red': '#f9a08c',
        'mars-orange': '#ffd07b',
        'mars-dust': '#e1c7a4',
        'mars-surface': '#b17864',
        'mars-shadow': '#7a4f3e',
        'space-blue': '#1d2b53',
        'space-dark': '#0c1220',
        'space-light': '#344d7f',
        'earth-olive': '#5a6b46',
        stone: {
          50: '#f8f7f4',
          100: '#f0eeea',
          200: '#e2e0d7',
          300: '#d0cdc0',
          400: '#b7b3a3',
          500: '#a59e8c',
          600: '#8c8575',
          700: '#736c5f',
          800: '#5f594f',
          900: '#4f4a42',
          950: '#2d2a25',
        },
      },
      animation: {
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      },
    }
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
};