const test = require('node:test');
const assert = require('node:assert/strict');
const { getPaymentApiBases, getSaveCardPaths } = require('../.test-build/utils/paymentApi.js');

test('getPaymentApiBases expands gateway-compatible bases and removes duplicates', () => {
  const bases = getPaymentApiBases('http://192.168.1.241:8080');

  assert.ok(bases.includes('http://192.168.1.241:8080'));
  assert.ok(bases.includes('http://192.168.1.241:8080/v1'));
  assert.ok(bases.includes('http://192.168.1.241:8080/api'));
  assert.ok(bases.includes('http://192.168.1.241:8080/booking-service'));
  assert.equal(new Set(bases).size, bases.length);
});

test('getSaveCardPaths includes canonical and legacy save-card endpoints', () => {
  const paths = getSaveCardPaths();

  assert.ok(paths.includes('/payment/saved-cards/attach'));
  assert.ok(paths.includes('/payment/save-card'));
  assert.ok(paths.includes('/payment/attach-payment-method'));
  assert.ok(paths.includes('/payment/cards/save'));
});
