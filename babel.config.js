export default function (api) {
  api.cache(true);
  return {
    // Only one preset entry is needed
    presets: ['babel-preset-expo'],
    plugins: [
      // This must always be the last plugin
      'react-native-reanimated/plugin',
    ],
  };
};