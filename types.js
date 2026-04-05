/** Built-in type validators for @torquedev/schema. Each validator: (value) => boolean */

/** @type {Map<string, (v: any) => boolean>} */
const _map = new Map();

_map.set('string', (v) => typeof v === 'string');
_map.set('text', _map.get('string'));

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
_map.set('uuid', (v) => typeof v === 'string' && UUID_RE.test(v));

_map.set('integer', (v) => Number.isInteger(v));
_map.set('float', (v) => typeof v === 'number' && Number.isFinite(v));
_map.set('decimal', _map.get('float'));
_map.set('boolean', (v) => typeof v === 'boolean');

const ISO_PREFIX_RE = /^\d{4}-\d{2}/;
_map.set('timestamp', (v) => typeof v === 'string' && ISO_PREFIX_RE.test(v) && !isNaN(Date.parse(v)));
_map.set('datetime', _map.get('timestamp'));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
_map.set('email', (v) => typeof v === 'string' && EMAIL_RE.test(v));

_map.set('url', (v) => {
  if (typeof v !== 'string') return false;
  try { new URL(v); return true; } catch { return false; }
});

// Accepts any non-null, non-array object — including class instances (Date, etc.)
_map.set('object', (v) => typeof v === 'object' && v !== null && !Array.isArray(v));
_map.set('array', Array.isArray);

/**
 * Proxy wrapping the Map so both dot-notation (validators.string)
 * and Map-style (.get('string')) access work correctly.
 */
const validators = new Proxy(_map, {
  get(target, prop) {
    // Pass through native Map methods (get, set, has, delete, etc.)
    if (typeof target[prop] === 'function') return target[prop].bind(target);
    // Fall back to Map lookup for string keys (e.g. validators.string)
    return target.get(prop);
  },
});

/**
 * Register a custom type validator.
 * @param {string} name - Non-empty string type name
 * @param {(v: any) => boolean} checkFn - Validator function
 */
function defineType(name, checkFn) {
  if (typeof name !== 'string' || !name) throw new Error('defineType: name must be a non-empty string');
  if (typeof checkFn !== 'function') throw new Error('defineType: checkFn must be a function');
  _map.set(name, checkFn);
}

export { validators, defineType };
