import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#FFFF00',
        bg: '#070707',
        surface: '#121212',
        card: '#181818',
        hairline: '#2A2A2A',
        muted: '#CBCBCB',
        subtle: '#888888',
        success: '#3BD17A',
        warning: '#F5A623',
        danger: '#FF5A5F',
      },
      borderRadius: {
        card: '12px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
