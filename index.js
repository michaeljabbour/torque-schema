/**
 * @torquedev/schema — Type validators and contract checking for Torque.
 *
 * Usage:
 *   import { createTypeValidator, validateRequired } from '@torquedev/schema';
 *   const validate = createTypeValidator();
 *   validate('uuid', someValue, 'fieldName');  // => null or violation string
 *   validate.registerType('phone', (v) => typeof v === 'string' && /^\+?[1-9]\d{1,14}$/.test(v));
 *   validateRequired(args, inputContract);  // => null or violation string
 */

export { createTypeValidator } from './validator.js';
export { validators, defineType } from './types.js';
export { validateRequired } from './required.js';
