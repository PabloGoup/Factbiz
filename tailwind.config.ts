import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"]
      },
      colors: {
        ink: "#0f172a",
        line: "#d9e3f0",
        canvas: "#f3f6fb",
        accent: "#0f4c81",
        success: "#0e7490",
        warn: "#b45309",
        danger: "#b91c1c"
      },
      boxShadow: {
        panel: "0 24px 80px -36px rgba(15, 23, 42, 0.22)"
      },
      backgroundImage: {
        hero: "radial-gradient(circle at top left, rgba(15, 76, 129, 0.14), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,246,251,0.98))"
      }
    }
  },
  plugins: []
};

export default config;
