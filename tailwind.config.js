/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#030712',
          900: '#0B0F19',
          800: '#111827',
          700: '#1F2937',
        },
        shield: {
          safe: '#10B981',
          'safe-dark': '#064E3B',
          'safe-light': '#D1FAE5',
          warning: '#F59E0B',
          'warning-dark': '#78350F',
          'warning-light': '#FEF3C7',
          danger: '#F43F5E',
          'danger-dark': '#881337',
          'danger-light': '#FFE4E6',
          cyan: '#06B6D4',
          indigo: '#6366F1',
        },
      },
    },
  },
  plugins: [],
};
