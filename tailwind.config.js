/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat Variable', 'Montserrat', 'sans-serif'],
        serif: ['Playfair Display Variable', 'Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
