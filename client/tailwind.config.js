/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F97316",
        "primary-hover": "#EA6C0A",
        surface: "#FFFFFF",
        background: "#FAFAFA",
        "border-default": "#E2E8F0",
        "text-primary": "#0F172A",
        "text-secondary": "#64748B",
        success: "#22C55E",
        warning: "#EAB308",
        danger: "#EF4444",
        "muted-bg": "#F1F5F9"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
