/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{vue,html}", // If using Vue
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        navy: '#1E3A5F',
        amber: '#C9A84C',
        success: '#2E7D32',
        warning: '#F57C00',
        error: '#C62828',
        info: '#1565C0',
      },
      boxShadow: {
        card: '0 12px 30px rgba(30, 58, 95, 0.08)',
      },
    },
  },
  plugins: [],
}