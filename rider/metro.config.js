// Monorepo-aware Metro config (Expo SDK 54 + pnpm) with NativeWind.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the monorepo root too (so @kari/types changes are picked up),
//    appending to — not replacing — Expo's defaults.
config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), projectRoot, workspaceRoot]));

// 2. Resolve modules from the app first, then the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
