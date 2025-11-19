/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6600',
          50: '#FFE5D6',
          100: '#FFD6BF',
          200: '#FFB38C',
          300: '#FF9059',
          400: '#FF7B2C',
          500: '#FF6600',
          600: '#CC5200',
          700: '#993D00',
          800: '#662900',
          900: '#331400',
        },
        secondary: {
          DEFAULT: '#0055A4',
          50: '#CCE0F5',
          100: '#B8D4F1',
          200: '#8FBCE9',
          300: '#66A4E1',
          400: '#3D8CD9',
          500: '#0055A4',
          600: '#004485',
          700: '#003366',
          800: '#002247',
          900: '#001128',
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
