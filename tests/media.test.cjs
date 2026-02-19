const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const buildRoot = path.resolve(__dirname, '..', '.test-build');

const ensureModule = (relativePath, contents) => {
  const filePath = path.join(buildRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
};

const loadMediaModule = () => {
  const mediaPath = path.join(buildRoot, 'utils/media.js');
  delete require.cache[require.resolve(mediaPath)];
  return require(mediaPath);
};

ensureModule(
  'node_modules/react-native/index.js',
  `
module.exports = {
  Platform: { OS: 'ios' },
};
`,
);

test('resolveMediaUrl uses EXPO_PUBLIC_SERVER_URL for relative media paths', () => {
  process.env.EXPO_PUBLIC_SERVER_URL = 'http://api.example.com:8080';
  delete process.env.EXPO_PUBLIC_MEDIA_BASE_URL;
  global.__DEV__ = false;

  const { resolveMediaUrl } = loadMediaModule();
  const url = resolveMediaUrl('/media/stations/1/logo.png');

  assert.equal(url, 'http://api.example.com:8080/media/stations/1/logo.png');
});

test('resolveMediaUrl honors EXPO_PUBLIC_MEDIA_BASE_URL override', () => {
  process.env.EXPO_PUBLIC_SERVER_URL = 'http://api.example.com:8080';
  process.env.EXPO_PUBLIC_MEDIA_BASE_URL = 'http://media.example.com:8090';
  global.__DEV__ = false;

  const { resolveMediaUrl } = loadMediaModule();
  const url = resolveMediaUrl('/media/programs/21/picture.jpg');

  assert.equal(url, 'http://media.example.com:8090/media/programs/21/picture.jpg');
});

test('resolveMediaUrl rewrites absolute URLs to localhost on Android dev when server is remote', () => {
  process.env.EXPO_PUBLIC_SERVER_URL = 'http://192.168.1.241:8080';
  delete process.env.EXPO_PUBLIC_MEDIA_BASE_URL;
  global.__DEV__ = true;

  const rn = require(path.join(buildRoot, 'node_modules/react-native/index.js'));
  rn.Platform.OS = 'android';

  const { resolveMediaUrl } = loadMediaModule();
  const url = resolveMediaUrl('http://192.168.1.241:8080/media/stations/2/picture.jpg');

  assert.equal(url, 'http://localhost:8080/media/stations/2/picture.jpg');
});
