import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { validators, defineType } from '../types.js';

describe('validators.string', () => {
  it('accepts a string', () => { assert.strictEqual(validators.string('hello'), true); });
  it('accepts an empty string', () => { assert.strictEqual(validators.string(''), true); });
  it('rejects a number', () => { assert.strictEqual(validators.string(42), false); });
  it('rejects null', () => { assert.strictEqual(validators.string(null), false); });
  it('rejects undefined', () => { assert.strictEqual(validators.string(undefined), false); });
});

describe('validators.text (alias for string)', () => {
  it('accepts a string', () => { assert.strictEqual(validators.text('hello'), true); });
  it('rejects a number', () => { assert.strictEqual(validators.text(42), false); });
});

describe('validators.uuid', () => {
  it('accepts a valid v4 UUID', () => { assert.strictEqual(validators.uuid('550e8400-e29b-41d4-a716-446655440000'), true); });
  it('accepts a valid v1 UUID', () => { assert.strictEqual(validators.uuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8'), true); });
  it('accepts uppercase UUID', () => { assert.strictEqual(validators.uuid('550E8400-E29B-41D4-A716-446655440000'), true); });
  it('rejects a number', () => { assert.strictEqual(validators.uuid(42), false); });
  it('rejects a random string', () => { assert.strictEqual(validators.uuid('not-a-uuid'), false); });
  it('rejects null', () => { assert.strictEqual(validators.uuid(null), false); });
  it('rejects a UUID missing a section', () => { assert.strictEqual(validators.uuid('550e8400-e29b-41d4-a716'), false); });
});

describe('validators.integer', () => {
  it('accepts an integer', () => { assert.strictEqual(validators.integer(42), true); });
  it('accepts zero', () => { assert.strictEqual(validators.integer(0), true); });
  it('accepts negative integer', () => { assert.strictEqual(validators.integer(-7), true); });
  it('rejects a float', () => { assert.strictEqual(validators.integer(3.14), false); });
  it('rejects a string', () => { assert.strictEqual(validators.integer('42'), false); });
  it('rejects NaN', () => { assert.strictEqual(validators.integer(NaN), false); });
});

describe('validators.float', () => {
  it('accepts a float', () => { assert.strictEqual(validators.float(3.14), true); });
  it('accepts an integer (integers are valid floats)', () => { assert.strictEqual(validators.float(42), true); });
  it('accepts zero', () => { assert.strictEqual(validators.float(0), true); });
  it('rejects NaN', () => { assert.strictEqual(validators.float(NaN), false); });
  it('rejects Infinity', () => { assert.strictEqual(validators.float(Infinity), false); });
  it('rejects a string', () => { assert.strictEqual(validators.float('3.14'), false); });
});

describe('validators.decimal (alias for float)', () => {
  it('accepts a float', () => { assert.strictEqual(validators.decimal(3.14), true); });
  it('rejects a string', () => { assert.strictEqual(validators.decimal('3.14'), false); });
});

describe('validators.boolean', () => {
  it('accepts true', () => { assert.strictEqual(validators.boolean(true), true); });
  it('accepts false', () => { assert.strictEqual(validators.boolean(false), true); });
  it('rejects 1', () => { assert.strictEqual(validators.boolean(1), false); });
  it('rejects "true"', () => { assert.strictEqual(validators.boolean('true'), false); });
  it('rejects null', () => { assert.strictEqual(validators.boolean(null), false); });
});

describe('validators.timestamp', () => {
  it('accepts an ISO 8601 string', () => { assert.strictEqual(validators.timestamp('2026-03-30T17:00:00Z'), true); });
  it('accepts a date-only ISO string', () => { assert.strictEqual(validators.timestamp('2026-03-30'), true); });
  it('rejects "last tuesday"', () => { assert.strictEqual(validators.timestamp('last tuesday'), false); });
  it('rejects a number', () => { assert.strictEqual(validators.timestamp(1711814400000), false); });
  it('rejects an empty string', () => { assert.strictEqual(validators.timestamp(''), false); });
});

describe('validators.datetime (alias for timestamp)', () => {
  it('accepts an ISO 8601 string', () => { assert.strictEqual(validators.datetime('2026-03-30T17:00:00Z'), true); });
  it('rejects a number', () => { assert.strictEqual(validators.datetime(42), false); });
});

describe('validators.email', () => {
  it('accepts a valid email', () => { assert.strictEqual(validators.email('user@example.com'), true); });
  it('accepts email with subdomain', () => { assert.strictEqual(validators.email('user@mail.example.com'), true); });
  it('rejects a string without @', () => { assert.strictEqual(validators.email('not-an-email'), false); });
  it('rejects a string with spaces', () => { assert.strictEqual(validators.email('user @example.com'), false); });
  it('rejects a number', () => { assert.strictEqual(validators.email(42), false); });
});

describe('validators.url', () => {
  it('accepts an https URL', () => { assert.strictEqual(validators.url('https://example.com'), true); });
  it('accepts an http URL with path', () => { assert.strictEqual(validators.url('http://example.com/path?q=1'), true); });
  it('rejects a random string', () => { assert.strictEqual(validators.url('not-a-url'), false); });
  it('rejects a number', () => { assert.strictEqual(validators.url(42), false); });
  it('rejects an empty string', () => { assert.strictEqual(validators.url(''), false); });
});

describe('validators.object', () => {
  it('accepts a plain object', () => { assert.strictEqual(validators.object({ foo: 1 }), true); });
  it('accepts an empty object', () => { assert.strictEqual(validators.object({}), true); });
  it('rejects an array', () => { assert.strictEqual(validators.object([1, 2]), false); });
  it('rejects null', () => { assert.strictEqual(validators.object(null), false); });
  it('rejects undefined', () => { assert.strictEqual(validators.object(undefined), false); });
  it('rejects a string', () => { assert.strictEqual(validators.object('{}'), false); });
});

describe('validators.array', () => {
  it('accepts an array', () => { assert.strictEqual(validators.array([1, 2, 3]), true); });
  it('accepts an empty array', () => { assert.strictEqual(validators.array([]), true); });
  it('rejects an object', () => { assert.strictEqual(validators.array({ length: 2 }), false); });
  it('rejects a string', () => { assert.strictEqual(validators.array('not an array'), false); });
});

describe('defineType', () => {
  after(() => { validators.delete('test_custom'); });

  it('registers a new type on the validators map', () => {
    defineType('test_custom', (val) => typeof val === 'string' && val.startsWith('test_'));
    assert.strictEqual(validators.get('test_custom')('test_hello'), true);
    assert.strictEqual(validators.get('test_custom')('nope'), false);
  });
  it('throws on empty name', () => {
    assert.throws(() => defineType('', () => true), /name must be a non-empty string/);
  });
  it('throws on non-function checkFn', () => {
    assert.throws(() => defineType('valid_name', 'not-a-fn'), /checkFn must be a function/);
  });
});
