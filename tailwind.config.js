/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
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
