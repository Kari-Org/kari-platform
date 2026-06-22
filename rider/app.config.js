// Dynamic Expo config: keeps everything in app.json and injects the Google Maps
// Android key from the machine-global env var (process.env.GOOGLE_MAPS_API_KEY,
// set in ~/.zshenv) so the key never lives in the repo and is shared across apps.
module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return config; // no key in this environment → leave config untouched
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...(config.android?.config ?? {}),
        googleMaps: {
          ...(config.android?.config?.googleMaps ?? {}),
          apiKey: key,
        },
      },
    },
  };
};
