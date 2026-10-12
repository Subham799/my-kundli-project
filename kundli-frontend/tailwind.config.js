/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif:  ["'Cinzel'", "Georgia", "serif"],
        devanagari: ["'Noto Sans Devanagari'", "sans-serif"],
      },
      colors: {
        cosmic: {
          950: "#020B18",
          900: "#070F1E",
          800: "#0D1829",
        },
      },
      backdropBlur: {
        "2xl": "48px",
        "3xl": "64px",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
