/**
 * Verification script: checks that the actual JS exports match the TypeScript declarations.
 * Usage: node verify-declarations.js
 * Expected output: "All exports match declarations"
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let failed = false;

function check(label, condition, detail = '') {
  if (!condition) {
    console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failed = true;
  } else {
    console.log(`  PASS: ${label}`);
  }
}

// ── 1. Check .d.ts file exists ───────────────────────────────────────────────
console.log('\n[torque-schema] Checking declaration file exists...');
check('torque-schema/index.d.ts exists', existsSync(join(__dirname, 'index.d.ts')));

// ── 2. Check package.json has "types" ────────────────────────────────────────
const { readFileSync } = await import('fs');
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

console.log('\n[torque-schema] Checking package.json fields...');
check('package.json has "types"', pkg.types === 'index.d.ts', `got: ${pkg.types}`);

// ── 3. Import the actual JS module and check all declared exports ─────────────
console.log('\n[torque-schema] Checking JS module exports...');
const schemaExports = await import('./index.js');

const declaredSchemaExports = [
  'createTypeValidator',
  'validators',
  'defineType',
  'validateRequired',
];

for (const name of declaredSchemaExports) {
  check(`index.js exports '${name}'`, name in schemaExports, `got: ${typeof schemaExports[name]}`);
}

// ── 4. Verify createTypeValidator() returns a callable with registerType ──────
console.log('\n[torque-schema] Checking createTypeValidator shape...');
const { createTypeValidator } = schemaExports;
check('createTypeValidator is a function', typeof createTypeValidator === 'function');
const validator = createTypeValidator();
check('createTypeValidator() returns a function', typeof validator === 'function');
check('returned validator has registerType()', typeof validator.registerType === 'function');

// ── 5. Verify validators is a Map (with .get and .set) ───────────────────────
console.log('\n[torque-schema] Checking validators shape...');
const { validators } = schemaExports;
check('validators has .get()', typeof validators.get === 'function');
check('validators has .set()', typeof validators.set === 'function');
check("validators.get('string') is a function", typeof validators.get('string') === 'function');
check("validators.get('uuid') is a function",   typeof validators.get('uuid') === 'function');

// ── 6. Verify defineType ──────────────────────────────────────────────────────
console.log('\n[torque-schema] Checking defineType...');
const { defineType } = schemaExports;
check('defineType is a function', typeof defineType === 'function');

// ── 7. Verify validateRequired ────────────────────────────────────────────────
console.log('\n[torque-schema] Checking validateRequired...');
const { validateRequired } = schemaExports;
check('validateRequired is a function', typeof validateRequired === 'function');
// Quick sanity check
const result = validateRequired({ name: 'alice' }, { name: { required: true } });
check('validateRequired returns null when field present', result === null, `got: ${result}`);
const missing = validateRequired({}, { name: { required: true } });
check('validateRequired returns string when field missing', typeof missing === 'string', `got: ${missing}`);

// ── Done ──────────────────────────────────────────────────────────────────────
console.log('');
if (failed) {
  console.error('FAIL: Some checks failed (see above)');
  process.exit(1);
} else {
  console.log('All exports match declarations');
}
