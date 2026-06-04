import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kari — Seamless Rides, Your Way',
  description:
    'Book a ride, drive and earn, or share the journey — Kari makes commuting in Nigeria effortless, affordable, and safe.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon-180.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#000D26',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Fonts are self-hosted via @font-face in src/styles/tokens.css (imported by
  // globals.css); body font + page wash come from the globals base layer.
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
