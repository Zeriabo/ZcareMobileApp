const test = require('node:test');
const assert = require('node:assert/strict');

// Validators tests
const { Validators, sanitizeValue, safeGet } = require('../.test-build/utils/validators.js');

// Email validation tests
test('Validators.email - valid emails', () => {
  assert.equal(Validators.email('user@example.com'), true);
  assert.equal(Validators.email('test.user+tag@domain.co.uk'), true);
});

test('Validators.email - invalid emails', () => {
  assert.equal(Validators.email('invalid@'), false);
  assert.equal(Validators.email('@example.com'), false);
  assert.equal(Validators.email('plain text'), false);
  assert.equal(Validators.email(''), false);
});

// Required field validation
test('Validators.required - truthy values', () => {
  assert.equal(Validators.required('text'), true);
  assert.equal(Validators.required('0'), true);
  assert.equal(Validators.required(123), true);
  assert.equal(Validators.required(true), true);
});

test('Validators.required - falsy values', () => {
  assert.equal(Validators.required(''), false);
  assert.equal(Validators.required('   '), false);
  assert.equal(Validators.required(null), false);
  assert.equal(Validators.required(undefined), false);
});

// Password strength tests
test('Validators.strongPassword - strong passwords', () => {
  assert.equal(Validators.strongPassword('SecurePassword123'), true);
  assert.equal(Validators.strongPassword('MyPassword456'), true);
});

test('Validators.strongPassword - weak passwords', () => {
  assert.equal(Validators.strongPassword('weak'), false);
  assert.equal(Validators.strongPassword('12345678'), false);
  assert.equal(Validators.strongPassword('password'), false);
  assert.equal(Validators.strongPassword('PASSWORD'), false);
});

// Phone number tests
test('Validators.phone - valid phone numbers', () => {
  assert.equal(Validators.phone('+1-234-567-8900'), true);
  assert.equal(Validators.phone('1234567890'), true);
  assert.equal(Validators.phone('+44 20 7946 0958'), true);
});

// Length validation
test('Validators.minLength', () => {
  assert.equal(Validators.minLength('hello', 3), true);
  assert.equal(Validators.minLength('hi', 3), false);
  assert.equal(Validators.minLength('', 0), true);
});

test('Validators.maxLength', () => {
  assert.equal(Validators.maxLength('hello', 10), true);
  assert.equal(Validators.maxLength('hello', 5), true);
  assert.equal(Validators.maxLength('hello world', 5), false);
});

// Number validation
test('Validators.number', () => {
  assert.equal(Validators.number(123), true);
  assert.equal(Validators.number(-45.67), true);
  assert.equal(Validators.number(0), true);
  assert.equal(Validators.number('abc'), false);
  assert.equal(Validators.number(null), false);
  assert.equal(Validators.number(NaN), false);
});

test('Validators.positiveNumber', () => {
  assert.equal(Validators.positiveNumber(100), true);
  assert.equal(Validators.positiveNumber(0.5), true);
  assert.equal(Validators.positiveNumber(0), false);
  assert.equal(Validators.positiveNumber(-5), false);
});

// Safe property access tests
test('safeGet - nested property access', () => {
  const obj = { user: { profile: { name: 'John' } } };
  assert.equal(safeGet(obj, 'user.profile.name'), 'John');
  assert.equal(safeGet(obj, 'user.profile.email'), undefined);
  assert.equal(safeGet(obj, 'user.profile.email', 'no-email@test.com'), 'no-email@test.com');
});

test('safeGet - handles null/undefined gracefully', () => {
  assert.equal(safeGet(null, 'any.path'), undefined);
  assert.equal(safeGet(undefined, 'any.path'), undefined);
  assert.equal(safeGet({ a: null }, 'a.b.c'), undefined);
});

// Sanitize value tests
test('sanitizeValue - removes null and undefined', () => {
  assert.equal(sanitizeValue(null, 'default'), 'default');
  assert.equal(sanitizeValue(undefined, 'default'), 'default');
  assert.equal(sanitizeValue('value', 'default'), 'value');
  assert.equal(sanitizeValue(0, 'default'), 0);
  assert.equal(sanitizeValue('', 'default'), '');
});
