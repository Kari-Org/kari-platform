// jest-expo wires the Expo / React Native transform, module mocks, and
// transformIgnorePatterns needed to run tests against RN + Expo packages.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Only our own suites; never descend into build output or dependencies.
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};
