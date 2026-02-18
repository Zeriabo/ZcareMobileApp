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

const loadSignIn = () => {
  const authPath = path.join(buildRoot, 'redux/actions/AuthActions.js');
  delete require.cache[require.resolve(authPath)];
  return require(authPath).signIn;
};

test('signIn dispatches success actions and persists session', async () => {
  process.env.EXPO_PUBLIC_SERVER_URL = 'http://example.test:8080';
  global.__authTestCalls = { notifications: [], sessions: [] };

  ensureModule(
    'utils/notifications.js',
    `
exports.displayLocalNotification = async (...args) => {
  global.__authTestCalls.notifications.push(args);
};
`,
  );
  ensureModule(
    'utils/storage.js',
    `
exports.saveSession = async (session) => {
  global.__authTestCalls.sessions.push(session);
};
exports.removeSession = async () => {};
`,
  );
  ensureModule(
    'redux/actions/carActions.js',
    `
exports.getUserCars = (token) => ({ type: 'GET_USER_CARS', payload: token });
`,
  );
  ensureModule(
    'redux/actions/messageActions.js',
    `
exports.addMessage = (message) => ({ type: 'ADD_MESSAGE', payload: message });
exports.clearMessages = () => ({ type: 'CLEAR_MESSAGES' });
`,
  );

  const axios = require('axios');
  axios.post = async () => ({
    status: 200,
    data: { firstName: 'Zeriab', token: 'abc123', id: 1 },
  });
  axios.isAxiosError = () => false;

  const signIn = loadSignIn();
  const dispatched = [];
  const dispatch = (action) => {
    dispatched.push(action);
    return action;
  };

  await signIn({ username: 'zeriab', password: '123' })(dispatch);

  assert.equal(dispatched[0].type, 'SIGN_IN_SUCCESS');
  assert.equal(dispatched[1].type, 'GET_USER_CARS');
  assert.equal(dispatched[1].payload, 'abc123');
  assert.equal(global.__authTestCalls.sessions.length, 1);
  assert.equal(global.__authTestCalls.notifications.length, 1);
});

test('signIn dispatches network message when axios and fetch both fail', async () => {
  process.env.EXPO_PUBLIC_SERVER_URL = 'http://example.test:8080';
  global.__authTestCalls = { notifications: [], sessions: [] };

  ensureModule(
    'utils/notifications.js',
    `
exports.displayLocalNotification = async (...args) => {
  global.__authTestCalls.notifications.push(args);
};
`,
  );
  ensureModule(
    'utils/storage.js',
    `
exports.saveSession = async (session) => {
  global.__authTestCalls.sessions.push(session);
};
exports.removeSession = async () => {};
`,
  );
  ensureModule(
    'redux/actions/carActions.js',
    `
exports.getUserCars = (token) => ({ type: 'GET_USER_CARS', payload: token });
`,
  );
  ensureModule(
    'redux/actions/messageActions.js',
    `
exports.addMessage = (message) => ({ type: 'ADD_MESSAGE', payload: message });
exports.clearMessages = () => ({ type: 'CLEAR_MESSAGES' });
`,
  );

  const axios = require('axios');
  const networkErr = new Error('Network Error');
  networkErr.code = 'ERR_NETWORK';
  networkErr.config = {
    url: 'http://example.test:8080/users/signin',
    method: 'post',
    timeout: 15000,
    headers: {},
    data: JSON.stringify({ username: 'zeriab', password: '123' }),
  };
  axios.post = async () => {
    throw networkErr;
  };
  axios.isAxiosError = () => true;

  const oldFetch = global.fetch;
  const oldSetTimeout = global.setTimeout;
  global.fetch = async () => {
    throw new Error('Network request failed');
  };
  global.setTimeout = (fn) => {
    fn();
    return 0;
  };

  const signIn = loadSignIn();
  const dispatched = [];
  const dispatch = (action) => {
    dispatched.push(action);
    return action;
  };

  try {
    await signIn({ username: 'zeriab', password: '123' })(dispatch);
  } finally {
    global.fetch = oldFetch;
    global.setTimeout = oldSetTimeout;
  }

  assert.equal(dispatched[0].type, 'ADD_MESSAGE');
  assert.equal(dispatched[0].payload.text, 'Network request failed');
  assert.equal(dispatched[0].payload.status, 500);
  assert.equal(dispatched[1].type, 'CLEAR_MESSAGES');
});
