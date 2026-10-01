import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1e3a5f", light: "#2f5496", muted: "#5b9bd5" },
      },
    },
  },
  plugins: [],
};
export default config;
