import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTypeValidator, validators, defineType, validateRequired } from '../index.js';

describe('barrel export index.js', () => {
  it('exports createTypeValidator as a function', () => {
    assert.strictEqual(typeof createTypeValidator, 'function');
  });

  it('exports validators as a Map (or Proxy over Map)', () => {
    assert.ok(validators instanceof Map || (typeof validators === 'object' && validators !== null));
    // validators.get should work (Map-style)
    assert.strictEqual(typeof validators.get, 'function');
    // should have built-in types
    assert.strictEqual(typeof validators.get('string'), 'function');
  });

  it('exports defineType as a function', () => {
    assert.strictEqual(typeof defineType, 'function');
  });

  it('exports validateRequired as a function', () => {
    assert.strictEqual(typeof validateRequired, 'function');
  });

  it('createTypeValidator returns a working validator', () => {
    const validate = createTypeValidator();
    assert.strictEqual(validate('string', 'hello', 'field'), null);
    assert.match(validate('string', 42, 'field'), /expected string/);
  });

  it('validateRequired works correctly from barrel import', () => {
    const contract = { name: { type: 'string', required: true } };
    assert.strictEqual(validateRequired({ name: 'Alice' }, contract), null);
    assert.match(validateRequired({}, contract), /required field 'name' is missing/);
  });

  it('defineType registers a new type accessible via validators', () => {
    defineType('testBarrelType', (v) => v === 'barrel');
    assert.strictEqual(typeof validators.get('testBarrelType'), 'function');
    assert.strictEqual(validators.get('testBarrelType')('barrel'), true);
    assert.strictEqual(validators.get('testBarrelType')('other'), false);
  });
});
