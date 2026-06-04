import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kari Admin',
  description: 'Kari operations console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
