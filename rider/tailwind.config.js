/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../packages/mobile-core/src/**/*.{ts,tsx}',
  ],
  // Base NativeWind preset + the shared Kari theme (colors/fonts/radii).
  presets: [require('nativewind/preset'), require('@kari/mobile-core/tailwind-preset')],
  plugins: [],
};
