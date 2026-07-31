/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [  "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
 theme: {
    extend: {
      colors: {
        primary: '#CCFF00',
        dark: '#121212',
        'dark-secondary': '#1A1A1A',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
