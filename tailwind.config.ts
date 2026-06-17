import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f6efdf",
        sand: "#efe5d0",
        ink: "#785b4e",
        "ink-soft": "#866a5b",
        "ink-faint": "#a8927f",
        terracotta: "#d68d84",
        "terracotta-deep": "#c2756c",
        sage: "#9fae8b",
        line: "rgba(120, 91, 78, 0.14)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(120, 91, 78, 0.18)",
        "soft-lg": "0 12px 40px -12px rgba(120, 91, 78, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
