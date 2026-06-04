import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // @kari/types ships built JS in dist — no transpilation needed.
  // No ESLint config yet — don't let `next build` block on interactive setup.
  eslint: { ignoreDuringBuilds: true },
};

export default config;
