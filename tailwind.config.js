/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // --- THIS IS THE FIX ---
    // Scan all .html files in the root
    "./*.html", 
    // Scan all .js files in the /js folder and its subfolders
    "./js/**/*.js"
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: '#4A90E2',
        secondary: '#F4E8D8',
      }
    }
  },
  plugins: [],
}