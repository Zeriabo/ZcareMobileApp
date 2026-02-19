const test = require('node:test');
const assert = require('node:assert/strict');

const { goBackOrHome } = require('../.test-build/utils/navigation.js');

test('goBackOrHome calls goBack when navigation can go back', () => {
  let wentBack = false;
  let didReset = false;

  const navigation = {
    canGoBack: () => true,
    goBack: () => {
      wentBack = true;
    },
    reset: () => {
      didReset = true;
    },
  };

  goBackOrHome(navigation, 'MainTabs');

  assert.equal(wentBack, true);
  assert.equal(didReset, false);
});

test('goBackOrHome resets stack when goBack is unavailable', () => {
  let resetPayload = null;

  const navigation = {
    canGoBack: () => false,
    goBack: () => {},
    reset: (payload) => {
      resetPayload = payload;
    },
  };

  goBackOrHome(navigation, 'MainTabs');

  assert.deepEqual(resetPayload, {
    index: 0,
    routes: [{ name: 'MainTabs' }],
  });
});
