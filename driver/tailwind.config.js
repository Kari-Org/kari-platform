/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../packages/mobile-core/src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset'), require('@kari/mobile-core/tailwind-preset')],
  plugins: [],
};
