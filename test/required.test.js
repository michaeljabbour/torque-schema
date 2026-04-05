import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateRequired } from '../required.js';

describe('validateRequired', () => {
  const contract = {
    userId: { type: 'uuid', required: true },
    name: { type: 'string', required: true },
    bio: { type: 'string' },
  };
  it('returns null when all required fields are present', () => {
    assert.strictEqual(validateRequired({ userId: '550e8400-e29b-41d4-a716-446655440000', name: 'Alice', bio: 'hi' }, contract), null);
  });
  it('returns null when optional field is missing', () => {
    assert.strictEqual(validateRequired({ userId: '550e8400-e29b-41d4-a716-446655440000', name: 'Alice' }, contract), null);
  });
  it('returns a violation when a required field is missing', () => {
    const result = validateRequired({ name: 'Alice' }, contract);
    assert.match(result, /required field 'userId' is missing/);
  });
  it('returns the first missing required field', () => {
    const result = validateRequired({}, contract);
    assert.match(result, /required field 'userId' is missing/);
  });
  it('treats null value as missing', () => {
    assert.match(validateRequired({ userId: null, name: 'Alice' }, contract), /required field 'userId' is missing/);
  });
  it('treats undefined value as missing', () => {
    assert.match(validateRequired({ userId: undefined, name: 'Alice' }, contract), /required field 'userId' is missing/);
  });
  it('returns null for empty contract', () => {
    assert.strictEqual(validateRequired({ anything: 'goes' }, {}), null);
  });
  it('returns null when no fields are required', () => {
    assert.strictEqual(validateRequired({}, { bio: { type: 'string' }, age: { type: 'integer' } }), null);
  });
});
