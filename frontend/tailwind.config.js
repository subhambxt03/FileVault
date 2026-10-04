/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          900: "#0a0f1c",
          800: "#0f172a",
          700: "#1e293b",
          600: "#334155",
        },
        accent: {
          DEFAULT: "#6366f1",
          soft: "#818cf8",
          cyan: "#22d3ee",
        },
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(15, 23, 42, 0.6)",
      },
    },
  },
  plugins: [],
};