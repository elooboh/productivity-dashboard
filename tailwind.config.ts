import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#16181d",
        "surface-2": "#1d2026",
        border: "#2a2e37",
      },
    },
  },
  plugins: [],
};

export default config;
