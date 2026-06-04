import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // No ESLint config in this workspace — don't let `next build` block on it.
  eslint: { ignoreDuringBuilds: true },
  // sharp isn't built in this monorepo (allowBuilds: sharp=false); serve images
  // as-is. Fine for a static marketing site.
  images: { unoptimized: true },
};

export default config;
