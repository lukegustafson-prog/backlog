import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#37352f",
        subtle: "#787774",
        line: "#e9e9e7",
        hover: "#f1f1ef",
      },
    },
  },
  plugins: [],
} satisfies Config;
