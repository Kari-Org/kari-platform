import path from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // @kari/types ships built JS in dist — no transpilation needed.
  // No ESLint config yet — don't let `next build` block on interactive setup.
  eslint: { ignoreDuringBuilds: true },
  // Lean container output for Railway: a self-contained server + traced deps.
  // outputFileTracingRoot points at the monorepo root so workspace deps
  // (@kari/types) are traced correctly. Turbo/pnpm run this build with cwd set
  // to admin/, so `..` resolves to the repo root.
  output: 'standalone',
  outputFileTracingRoot: path.resolve(process.cwd(), '..'),
};

export default config;
