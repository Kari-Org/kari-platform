import type { Config } from 'tailwindcss';

/**
 * Kari Web — Tailwind theme for the marketing website (web/ workspace).
 *
 * This is the WEB analogue of packages/mobile-core/tailwind-preset.js, but the
 * two are intentionally different surfaces:
 *   - mobile-core  → React Native (NativeWind), Poppins, near-black app canvas
 *   - web (this)   → browser, Hanken Grotesk, LIGHT canvas + warm-yellow wash
 * Do not share the mobile preset into web. Keep names aligned where they overlap
 * (brand, ink, success, danger) so the vocabulary feels like one platform.
 *
 * Values mirror tokens.css / the platform design system.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}', './app/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: '#FFFF00',          // taxi yellow — CTAs, accents, active nav
        gold: '#FFD700',           // pressed / hover-darken
        amber: '#FFBB00',
        glow: '#FFF049',
        ink: '#000D26',            // deep navy — primary text + logo road
        night: '#0A0A0A',          // near-black dark cards on light page
        surface: '#121212',
        paper: { DEFAULT: '#FFFFFF', 2: '#FAFAFA', 3: '#F4F4F4' },
        line: { DEFAULT: '#E6E6E6', 2: '#DBDBDB' },
        muted: '#5C5C5C',          // on-light secondary text
        subtle: '#8A8A8A',         // on-light tertiary text
        success: '#1F9D55',
        info: '#0095FF',
        warning: '#F5852C',
        danger: '#E5484D',
        rating: '#FFC700',
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        wordmark: ['"Archivo Expanded"', '"Hanken Grotesk"', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        lg2: '16px',
        xl2: '24px',
        sheet: '32px',
        pill: '9999px',
      },
      maxWidth: {
        container: '1200px',
      },
      boxShadow: {
        card: '0 6px 20px rgba(0,0,0,.10)',
        lift: '0 18px 50px rgba(0,0,0,.16)',
        yellow: '0 12px 30px rgba(255,221,0,.35)',
      },
      backgroundImage: {
        'kari-page': 'linear-gradient(180deg, #FFFFFF 0%, #FFFEED 50%, #FFF8A7 100%)',
        'kari-amber': 'linear-gradient(180deg, #FFBB00 0%, #FFF049 100%)',
      },
      letterSpacing: {
        tightest: '-3px',
      },
    },
  },
  plugins: [],
};

export default config;
