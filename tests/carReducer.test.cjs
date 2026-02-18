const test = require('node:test');
const assert = require('node:assert/strict');

const carReducer = require('../.test-build/redux/reducers/carReducer.js').default;

test('adds car on GET_CAR_SUCCESS', () => {
  const car = { carId: 10, registrationPlate: 'ABC123' };
  const state = carReducer(undefined, { type: 'GET_CAR_SUCCESS', payload: car });

  assert.equal(state.cars.length, 1);
  assert.equal(state.cars[0], car);
});

test('replaces cars list on GET_USER_CARS_SUCCESS', () => {
  const cars = [
    { carId: 1, registrationPlate: 'AAA111' },
    { carId: 2, registrationPlate: 'BBB222' },
  ];

  const state = carReducer(undefined, {
    type: 'GET_USER_CARS_SUCCESS',
    payload: cars,
  });

  assert.deepEqual(state.cars, cars);
});

test('removes matching car on DELETE_CAR_SUCCESS', () => {
  const startState = {
    cars: [
      { carId: 1, registrationPlate: 'AAA111' },
      { carId: 2, registrationPlate: 'BBB222' },
    ],
  };

  const state = carReducer(startState, {
    type: 'DELETE_CAR_SUCCESS',
    payload: 1,
  });

  assert.deepEqual(state.cars, [{ carId: 2, registrationPlate: 'BBB222' }]);
});
