const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateDistanceKm } = require('../.test-build/utils/calulations.js');

test('returns 0km for identical coordinates', () => {
  const distance = calculateDistanceKm(40.7128, -74.006, 40.7128, -74.006);
  assert.equal(distance, 0);
});

test('calculates NYC to LA distance within realistic tolerance', () => {
  const distance = calculateDistanceKm(40.7128, -74.006, 34.0522, -118.2437);
  assert.ok(distance > 3900 && distance < 4000);
});

test('is symmetric regardless of point order', () => {
  const aToB = calculateDistanceKm(59.9139, 10.7522, 41.9028, 12.4964);
  const bToA = calculateDistanceKm(41.9028, 12.4964, 59.9139, 10.7522);

  assert.ok(Math.abs(aToB - bToA) < 1e-9);
});
