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

const setupAuthMocks = () => {
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
};

test('signIn dispatches success actions and persists session', async () => {
  process.env.EXPO_PUBLIC_SERVER_URL = 'http://example.test:8080';
  setupAuthMocks();

  const axios = require('axios');
  let postedBody = null;
  let postedUrl = null;
  axios.post = async () => ({
    status: 200,
    data: { firstName: 'Zeriab', token: 'abc123', id: 1 },
  });
  axios.post = async (url, body) => {
    postedUrl = url;
    postedBody = body;
    return {
      status: 200,
      data: { firstName: 'Zeriab', token: 'abc123', id: 1 },
    };
  };
  axios.isAxiosError = () => false;

  const signIn = loadSignIn();
  const dispatched = [];
  const dispatch = (action) => {
    dispatched.push(action);
    return action;
  };

  await signIn({ username: ' zeriab ', password: '123' })(dispatch);

  assert.equal(dispatched[0].type, 'SIGN_IN_SUCCESS');
  assert.equal(dispatched[1].type, 'GET_USER_CARS');
  assert.equal(dispatched[1].payload, 'abc123');
  assert.equal(postedUrl, 'http://example.test:8080/users/signin');
  assert.equal(postedBody.username, 'zeriab');
  assert.equal(global.__authTestCalls.sessions.length, 1);
  assert.equal(global.__authTestCalls.notifications.length, 1);
});

test('signIn dispatches network message when axios and fetch both fail', async () => {
  process.env.EXPO_PUBLIC_SERVER_URL = 'http://example.test:8080';
  setupAuthMocks();

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

  const oldSetTimeout = global.setTimeout;
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
    global.setTimeout = oldSetTimeout;
  }

  assert.equal(dispatched[0].type, 'ADD_MESSAGE');
  assert.equal(dispatched[0].payload.text, 'Network Error');
  assert.equal(dispatched[0].payload.status, 500);
  assert.equal(dispatched[1].type, 'CLEAR_MESSAGES');
});

test('signIn dispatches invalid-credentials message on 401', async () => {
  process.env.EXPO_PUBLIC_SERVER_URL = 'http://example.test:8080';
  setupAuthMocks();

  const axios = require('axios');
  axios.post = async () => {
    const err = new Error('Request failed with status code 401');
    err.response = {
      status: 401,
      data: { message: 'Invalid username or password' },
    };
    throw err;
  };

  const oldSetTimeout = global.setTimeout;
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
    await signIn({ username: 'zeriab', password: 'bad' })(dispatch);
  } finally {
    global.setTimeout = oldSetTimeout;
  }

  assert.equal(dispatched[0].type, 'ADD_MESSAGE');
  assert.equal(dispatched[0].payload.text, 'Invalid username or password');
  assert.equal(dispatched[0].payload.status, 401);
  assert.equal(dispatched[1].type, 'CLEAR_MESSAGES');
});
