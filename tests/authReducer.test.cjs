const test = require('node:test');
const assert = require('node:assert/strict');

const authReducer = require('../.test-build/redux/reducers/authReducer.js').default;

test('returns initial state for unknown action', () => {
  const state = authReducer(undefined, { type: 'UNKNOWN' });

  assert.equal(state.authenticationSuccess, false);
  assert.equal(state.authenticationFailed, false);
  assert.equal(state.registrationSuccess, false);
  assert.equal(state.registrationFailed, false);
  assert.equal(state.error, null);
  assert.ok(state.user);
  assert.equal(state.user.id, 0);
});

test('handles SIGN_IN_SUCCESS', () => {
  const user = {
    id: 42,
    firstName: 'Zoe',
    lastName: 'Smith',
    username: 'zoe',
    token: 'token-123',
    active: true,
    dateOfBirth: '1990-01-01',
    createDateTime: null,
    updateDateTime: null,
    deviceRegistrationToken: null,
  };

  const state = authReducer(undefined, { type: 'SIGN_IN_SUCCESS', payload: user });

  assert.equal(state.user, user);
  assert.equal(state.error, null);
  assert.equal(state.authenticationSuccess, true);
  assert.equal(state.authenticationFailed, false);
});

test('handles SIGN_OUT by resetting state', () => {
  const signedInState = authReducer(undefined, {
    type: 'SIGN_IN_SUCCESS',
    payload: {
      id: 1,
      firstName: 'A',
      lastName: 'B',
      username: 'ab',
      token: 'x',
      active: true,
      dateOfBirth: '2000-01-01',
      createDateTime: null,
      updateDateTime: null,
      deviceRegistrationToken: null,
    },
  });

  const signedOutState = authReducer(signedInState, { type: 'SIGN_OUT' });

  assert.equal(signedOutState.authenticationSuccess, false);
  assert.equal(signedOutState.authenticationFailed, false);
  assert.equal(signedOutState.registrationSuccess, false);
  assert.equal(signedOutState.registrationFailed, false);
  assert.equal(signedOutState.error, null);
  assert.equal(signedOutState.user.id, 0);
});
