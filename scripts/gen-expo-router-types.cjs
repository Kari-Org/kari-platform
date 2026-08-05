#!/usr/bin/env node
/**
 * Generate Expo Router's typed-routes declaration (`.expo/types/router.d.ts`)
 * for the app in the current working directory, WITHOUT booting Metro.
 *
 * Why this exists: the mobile apps set `experiments.typedRoutes: true`, which
 * makes `<Link href>` / `router.push()` etc. type-checked against the real
 * file-based routes. But that declaration is normally only emitted while the
 * Metro dev server runs, and `.expo/` is gitignored — so in CI `tsc --noEmit`
 * saw the loose fallback `Href` type and invalid routes slipped through. We run
 * this before `tsc` so route typos actually fail typecheck.
 *
 * This mirrors what `@expo/cli` does for `expo customize tsconfig.json`
 * (see @expo/cli .../type-generation/routes.js): it calls the same
 * `expo-router` internals, just scoped to `app/` so the require.context
 * ponyfill never walks node_modules.
 *
 * Run from an app workspace root (Turbo/pnpm set cwd to the workspace).
 */
const path = require('path');
const fs = require('fs');

const appDir = process.cwd();
const routerDir = path.join(appDir, 'app');

if (!fs.existsSync(routerDir)) {
  // Not an Expo Router app (no app/ dir) — nothing to generate.
  console.log(`[gen-router-types] no app/ directory in ${appDir}; skipping`);
  process.exit(0);
}

// expo-router reads EXPO_ROUTER_APP_ROOT to locate the routes root. Set it
// BEFORE requiring the module so its fs-based require.context only scans app/.
process.env.EXPO_ROUTER_APP_ROOT = routerDir;

let requireContext;
let EXPO_ROUTER_CTX_IGNORE;
let getTypedRoutesDeclarationFile;
try {
  requireContext = require('expo-router/build/testing-library/require-context-ponyfill').default;
  ({ EXPO_ROUTER_CTX_IGNORE } = require('expo-router/_ctx-shared'));
  ({ getTypedRoutesDeclarationFile } = require('expo-router/build/typed-routes/generate'));
} catch (err) {
  console.error(
    '[gen-router-types] could not load expo-router typed-routes internals ' +
      '(expo-router layout may have changed across versions):',
    err.message,
  );
  process.exit(1);
}

const ctx = requireContext(routerDir, true, EXPO_ROUTER_CTX_IGNORE);
const declaration = getTypedRoutesDeclarationFile(ctx);
if (!declaration) {
  console.error('[gen-router-types] no declaration produced for', appDir);
  process.exit(1);
}

const typesDir = path.join(appDir, '.expo', 'types');
fs.mkdirSync(typesDir, { recursive: true });
fs.writeFileSync(path.join(typesDir, 'router.d.ts'), declaration);
console.log(
  `[gen-router-types] wrote ${path.relative(appDir, path.join(typesDir, 'router.d.ts'))} ` +
    `(${ctx.keys().length} route files)`,
);
