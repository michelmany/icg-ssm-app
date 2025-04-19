import type { Config } from "tailwindcss";
import processedTokens from '../figma-to-css/src/tokens/processed-tokens.json';

export default {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/sd-tnrsm-library/dist/**/*.{js,jsx,ts,tsx}" // Specific to dist folder
  ],
  theme: {
    extend: {
      ...processedTokens,
    },
  },
  plugins: [],
} satisfies Config;
