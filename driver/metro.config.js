// Monorepo-aware Metro config (Expo SDK 54 + pnpm) with NativeWind.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so @kari/mobile-core + @kari/types changes are picked up.
config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), projectRoot, workspaceRoot]),
);

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
