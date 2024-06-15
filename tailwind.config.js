// tailwind.config.js
import { nextui, semanticColors } from '@nextui-org/react';

console.log(semanticColors.dark);
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    // ...
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [
    nextui({
      themes: {
        light: {
          colors: semanticColors.dark,
        },
      },
    }),
  ],
};

export default config;
