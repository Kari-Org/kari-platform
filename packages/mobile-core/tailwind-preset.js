/**
 * Shared NativeWind theme preset for all Kari mobile apps (rider + driver).
 * Each app's tailwind.config.js does:
 *   presets: [require('nativewind/preset'), require('@kari/mobile-core/tailwind-preset')]
 * and includes `../packages/mobile-core/src/**` in `content` so shared-component
 * classes are generated.
 */
module.exports = {
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
        danger: '#FF5A5F',
      },
      // Distinct keys so they don't collide with Tailwind's font-weight utilities.
      fontFamily: {
        // Workhorse = Hanken Grotesk (keys unchanged so existing className usage
        // keeps working — only the family behind them changed from Poppins).
        sans: ['HankenGrotesk_400Regular'],
        pmedium: ['HankenGrotesk_500Medium'],
        psemibold: ['HankenGrotesk_600SemiBold'],
        pbold: ['HankenGrotesk_700Bold'],
        wordmark: ['ArchivoExpanded'], // the "Kari" wordmark only (Archivo @125% width)
        mono: ['GeistMono_400Regular'], // IDs / OTPs / raw ₦ figures
      },
      borderRadius: {
        card: '12px',
        input: '30px',
        pill: '9999px',
      },
    },
  },
};
