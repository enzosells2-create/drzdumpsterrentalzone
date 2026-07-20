import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F2340",
          dark: "#0A1930",
          light: "#1E3A5F",
        },
        red: {
          DEFAULT: "#E53935",
          dark: "#C62828",
          light: "#EF5350",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-poppins)", "system-ui", "sans-serif"],
        signature: ["var(--font-caveat)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
