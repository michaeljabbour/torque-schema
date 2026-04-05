import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTypeValidator, describeType } from '../validator.js';

describe('createTypeValidator', () => {
  it('returns a function', () => {
    const validate = createTypeValidator();
    assert.strictEqual(typeof validate, 'function');
  });
});

describe('validate() — basic types', () => {
  const validate = createTypeValidator();
  it('returns null for a valid string', () => { assert.strictEqual(validate('string', 'hello', 'name'), null); });
  it('returns a violation string for invalid string', () => {
    const result = validate('string', 42, 'name');
    assert.strictEqual(typeof result, 'string');
    assert.match(result, /field 'name'/);
    assert.match(result, /expected string/);
    assert.match(result, /got number/);
  });
  it('returns null for a valid uuid', () => { assert.strictEqual(validate('uuid', '550e8400-e29b-41d4-a716-446655440000', 'id'), null); });
  it('returns a violation string for invalid uuid', () => {
    const result = validate('uuid', 'nope', 'id');
    assert.match(result, /field 'id'/);
    assert.match(result, /expected uuid/);
  });
  it('returns null for a valid integer', () => { assert.strictEqual(validate('integer', 42, 'count'), null); });
  it('returns null for a valid boolean', () => { assert.strictEqual(validate('boolean', true, 'active'), null); });
  it('handles type aliases (text -> string)', () => { assert.strictEqual(validate('text', 'hello', 'desc'), null); });
  it('handles type aliases (decimal -> float)', () => { assert.strictEqual(validate('decimal', 3.14, 'price'), null); });
  it('handles type aliases (datetime -> timestamp)', () => { assert.strictEqual(validate('datetime', '2026-03-30T17:00:00Z', 'created'), null); });
  it('returns a violation for unknown type', () => {
    const result = validate('banana', 'hello', 'fruit');
    assert.match(result, /unknown type 'banana'/);
  });
});

describe('validate() — violation message format', () => {
  const validate = createTypeValidator();
  it('includes the actual JS type in the message', () => { assert.match(validate('uuid', null, 'user_id'), /got null/); });
  it('says "got array" for arrays', () => { assert.match(validate('string', [1, 2], 'tags'), /got array/); });
  it('says "got undefined" for undefined', () => { assert.match(validate('string', undefined, 'name'), /got undefined/); });
});

describe('validate.registerType()', () => {
  it('registerType delegates to defineType — valid and invalid round-trip', () => {
    const validate = createTypeValidator();
    validate.registerType('positive', (v) => typeof v === 'number' && v > 0);
    assert.strictEqual(validate('positive', 5, 'amount'), null);
    assert.match(validate('positive', -1, 'amount'), /expected positive/);
  });
});

describe('describeType()', () => {
  it('returns "null" for null', () => { assert.strictEqual(describeType(null), 'null'); });
  it('returns "undefined" for undefined', () => { assert.strictEqual(describeType(undefined), 'undefined'); });
  it('returns "array" for arrays', () => { assert.strictEqual(describeType([1, 2, 3]), 'array'); });
  it('returns "number" for numbers', () => { assert.strictEqual(describeType(42), 'number'); });
  it('returns "string" for strings', () => { assert.strictEqual(describeType('hello'), 'string'); });
  it('returns "boolean" for booleans', () => { assert.strictEqual(describeType(true), 'boolean'); });
  it('returns "object" for plain objects', () => { assert.strictEqual(describeType({}), 'object'); });
});

describe('validate() — array-of-type (Type[])', () => {
  const validate = createTypeValidator();
  it('returns null for a valid string[]', () => { assert.strictEqual(validate('string[]', ['a', 'b'], 'tags'), null); });
  it('returns null for an empty array (string[])', () => { assert.strictEqual(validate('string[]', [], 'tags'), null); });
  it('returns a violation when array contains wrong type', () => {
    const result = validate('string[]', ['a', 42], 'tags');
    assert.match(result, /field 'tags\[1\]'/);
    assert.match(result, /expected string/);
    assert.match(result, /got number/);
  });
  it('returns a violation when value is not an array', () => {
    const result = validate('string[]', 'not an array', 'tags');
    assert.match(result, /field 'tags'/);
    assert.match(result, /expected array/);
    assert.match(result, /got string/);
  });
  it('works with uuid[]', () => { assert.strictEqual(validate('uuid[]', ['550e8400-e29b-41d4-a716-446655440000'], 'ids'), null); });
  it('catches bad item in uuid[]', () => {
    const result = validate('uuid[]', ['550e8400-e29b-41d4-a716-446655440000', 'bad'], 'ids');
    assert.match(result, /field 'ids\[1\]'/);
    assert.match(result, /expected uuid/);
  });
  it('works with integer[]', () => { assert.strictEqual(validate('integer[]', [1, 2, 3], 'counts'), null); });
  it('works with object[]', () => { assert.strictEqual(validate('object[]', [{ a: 1 }, { b: 2 }], 'items'), null); });
  it('returns a violation for unknown inner type', () => { assert.match(validate('banana[]', ['hello'], 'fruit'), /unknown type 'banana'/); });
});

describe('validate.registerType() — custom types', () => {
  it('registers and validates a custom phone type', () => {
    const validate = createTypeValidator();
    validate.registerType('phone', (v) => typeof v === 'string' && /^\+?[1-9]\d{1,14}$/.test(v));
    assert.strictEqual(validate('phone', '+15551234567', 'mobile'), null);
    const fail = validate('phone', 'not-a-phone', 'mobile');
    assert.match(fail, /field 'mobile'/);
    assert.match(fail, /expected phone/);
  });
  it('registers and validates a custom currency_cents type', () => {
    const validate = createTypeValidator();
    validate.registerType('currency_cents', (v) => Number.isInteger(v) && v >= 0);
    assert.strictEqual(validate('currency_cents', 1500, 'price'), null);
    const fail = validate('currency_cents', -1, 'price');
    assert.match(fail, /field 'price'/);
  });
  it('throws if name is not a string', () => {
    const validate = createTypeValidator();
    assert.throws(() => validate.registerType(42, () => true), /name must be a non-empty string/);
  });
  it('throws if checkFn is not a function', () => {
    const validate = createTypeValidator();
    assert.throws(() => validate.registerType('foo', 'not a function'), /checkFn must be a function/);
  });
  it('custom array-of-type works after registration', () => {
    const validate = createTypeValidator();
    validate.registerType('phone', (v) => typeof v === 'string' && /^\+?[1-9]\d{1,14}$/.test(v));
    assert.strictEqual(validate('phone[]', ['+15551234567', '+19998887777'], 'phones'), null);
    const fail = validate('phone[]', ['+15551234567', 'bad'], 'phones');
    assert.match(fail, /field 'phones\[1\]'/);
  });
});

describe('integration — full workflow via barrel import', () => {
  it('validates a realistic input contract', async () => {
    const { createTypeValidator, validateRequired } = await import('../index.js');
    const validate = createTypeValidator();
    const contract = {
      userId: { type: 'uuid', required: true },
      title: { type: 'string', required: true },
      tags: { type: 'string[]' },
      priority: { type: 'integer' },
    };
    const args = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Fix the bug',
      tags: ['urgent', 'backend'],
      priority: 1,
    };
    assert.strictEqual(validateRequired(args, contract), null);
    for (const [field, spec] of Object.entries(contract)) {
      if (args[field] !== undefined) {
        assert.strictEqual(validate(spec.type, args[field], field), null, `${field} should be valid`);
      }
    }
  });
  it('catches missing required field then type error', async () => {
    const { createTypeValidator, validateRequired } = await import('../index.js');
    const validate = createTypeValidator();
    const contract = { userId: { type: 'uuid', required: true }, title: { type: 'string', required: true } };
    assert.match(validateRequired({ title: 'hi' }, contract), /required field 'userId' is missing/);
    assert.match(validate('string', 42, 'title'), /field 'title': expected string, got number/);
  });
  it('custom type survives full round-trip', async () => {
    const { createTypeValidator } = await import('../index.js');
    const validate = createTypeValidator();
    validate.registerType('hex_color', (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v));
    assert.strictEqual(validate('hex_color', '#ff00aa', 'bg_color'), null);
    assert.match(validate('hex_color', 'red', 'bg_color'), /expected hex_color/);
    assert.strictEqual(validate('hex_color[]', ['#ff00aa', '#00ff00'], 'palette'), null);
    assert.match(validate('hex_color[]', ['#ff00aa', 'bad'], 'palette'), /field 'palette\[1\]'/);
  });
});
