const test = require('node:test');
const assert = require('node:assert/strict');

const {
  programsReducer,
} = require('../.test-build/redux/reducers/programsReducer.js');

test('sets loading true on FETCH_PROGRAMS_REQUEST', () => {
  const state = programsReducer(undefined, { type: 'FETCH_PROGRAMS_REQUEST' });

  assert.equal(state.loading, true);
  assert.equal(state.error, null);
  assert.deepEqual(state.programs, []);
});

test('stores programs on FETCH_PROGRAMS_SUCCESS', () => {
  const payload = [
    { id: 1, name: 'Basic', programType: 'BASIC' },
    { id: 2, name: 'Premium', programType: 'PREMIUM' },
  ];

  const state = programsReducer(undefined, {
    type: 'FETCH_PROGRAMS_SUCCESS',
    payload,
  });

  assert.equal(state.loading, false);
  assert.deepEqual(state.programs, payload);
});

test('stores error on FETCH_PROGRAMS_FAILURE', () => {
  const state = programsReducer(undefined, {
    type: 'FETCH_PROGRAMS_FAILURE',
    error: 'Network failed',
  });

  assert.equal(state.loading, false);
  assert.equal(state.error, 'Network failed');
});
