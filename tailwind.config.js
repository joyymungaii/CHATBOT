/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#1a1a1a',
        primary: '#791115',
        secondary: '#094166',
        accent: '#e8f4f8',
        muted: '#f0f4f8',
        'muted-foreground': '#718096',
      },
    },
  },
  plugins: [],
}
