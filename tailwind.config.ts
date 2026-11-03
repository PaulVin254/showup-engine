import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        canvas: "#101114",
        surface: {
          DEFAULT: "#17191e",
          elevated: "#23252b",
          input: "#25272c",
        },
        electric: {
          DEFAULT: "#1877f2",
          hover: "#2e86f8",
          cta: "#4589ff",
          subtle: "rgba(24, 119, 242, 0.12)",
        },
        whatsapp: {
          DEFAULT: "#25D366",
          dark: "#128C7E",
          teal: "#075E54",
          light: "#DCF8C6",
        },
      },
      boxShadow: {
        halo: "0 0 0 3px rgba(69, 137, 255, 0.35)",
        glow: "0 1px 2px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
