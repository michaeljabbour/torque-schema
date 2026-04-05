import { validators, defineType } from './types.js';

export function describeType(v) {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

export function createTypeValidator() {
  function validate(declaredType, actualValue, fieldName) {
    // — Array-of-type: "string[]", "uuid[]", etc. —
    if (declaredType.endsWith('[]')) {
      const innerType = declaredType.slice(0, -2);
      const innerChecker = validators.get(innerType);
      if (!innerChecker) return `field '${fieldName}': unknown type '${innerType}'`;
      if (!Array.isArray(actualValue))
        return `field '${fieldName}': expected array, got ${describeType(actualValue)}`;
      for (let i = 0; i < actualValue.length; i++) {
        if (!innerChecker(actualValue[i])) {
          return `field '${fieldName}[${i}]': expected ${innerType}, got ${describeType(actualValue[i])}`;
        }
      }
      return null;
    }
    // — Nullable types: "timestamp?", "string?", "uuid?", etc. —
    if (declaredType.endsWith('?')) {
      if (actualValue === null || actualValue === undefined) return null;
      const innerType = declaredType.slice(0, -1);
      const innerChecker = validators.get(innerType);
      if (!innerChecker) return `field '${fieldName}': unknown type '${innerType}'`;
      if (innerChecker(actualValue)) return null;
      return `field '${fieldName}': expected ${innerType} or null, got ${describeType(actualValue)}`;
    }
    // — Scalar types —
    const checker = validators.get(declaredType);
    if (!checker) return `field '${fieldName}': unknown type '${declaredType}'`;
    if (checker(actualValue)) return null;
    return `field '${fieldName}': expected ${declaredType}, got ${describeType(actualValue)}`;
  }
  // Note: registerType mutates the shared global _map in types.js — all validate instances see new types.
  validate.registerType = function registerType(name, checkFn) { defineType(name, checkFn); };
  return validate;
}
