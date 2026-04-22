/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Green - Works in both themes
        primary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        // Secondary/Accent Orange
        secondary: {
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800',
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',
        },
        // Surface colors for cards and backgrounds
        surface: {
          light: '#ffffff',
          dark: '#1e293b',
        },
        // Text colors
        text: {
          light: {
            primary: '#1e293b',
            secondary: '#64748b',
            tertiary: '#94a3b8',
          },
          dark: {
            primary: '#f1f5f9',
            secondary: '#cbd5e1',
            tertiary: '#94a3b8',
          },
        },
      },
    },
  },
  plugins: [],
}