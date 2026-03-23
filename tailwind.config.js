/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#bf953f',
          secondary: '#fcf6ba',
          accent: '#aa771c',
        },
        bg: {
          base: '#0c0c10',
        }
      }
    },
  },
  plugins: [],
}
