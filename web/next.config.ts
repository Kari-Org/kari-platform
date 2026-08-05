import path from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // No ESLint config in this workspace — don't let `next build` block on it.
  eslint: { ignoreDuringBuilds: true },
  // sharp isn't built in this monorepo (allowBuilds: sharp=false); serve images
  // as-is. Fine for a static marketing site.
  images: { unoptimized: true },
  // Lean container output for Railway. outputFileTracingRoot at the monorepo
  // root so the workspace dep (@kari/types) is traced; build cwd is web/.
  output: 'standalone',
  outputFileTracingRoot: path.resolve(process.cwd(), '..'),
  // (web-only change; deploy isolation is governed by web/railway.json watchPatterns)
};

export default config;
