// Flat ESLint config consumed by `expo lint` and the mobile CI gate.
// eslint-config-expo bundles the React / React Hooks / React Native / import
// rules Expo recommends for SDK 54. Prettier owns formatting, so there are no
// stylistic rules here — this catches real defects (unused vars, bad hook deps,
// unreachable code), not whitespace.
const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'babel.config.js'],
  },
];
