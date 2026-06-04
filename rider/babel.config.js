module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated 4 worklets — MUST be the last plugin. Without it, useAnimatedStyle
    // callbacks aren't compiled to worklets and crash at runtime ("HostFunction").
    plugins: ['react-native-worklets/plugin'],
  };
};
