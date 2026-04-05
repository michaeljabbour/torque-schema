/**
 * @torquedev/schema — TypeScript declarations
 */

// ── TypeValidator ─────────────────────────────────────────────────────────────

/**
 * A callable type validator returned by createTypeValidator().
 * Checks that `actualValue` matches `declaredType`; returns null on success
 * or a human-readable violation string on failure.
 */
export interface TypeValidator {
  (declaredType: string, actualValue: unknown, fieldName: string): string | null;
  /**
   * Register a custom named type validator into the shared global registry.
   * @param name - Non-empty string type name
   * @param checkFn - Returns true if the value is valid
   */
  registerType(name: string, checkFn: (value: unknown) => boolean): void;
}

/**
 * Create a new type validator function backed by the shared validators map.
 */
export declare function createTypeValidator(): TypeValidator;

// ── validators ────────────────────────────────────────────────────────────────

/**
 * The shared map of built-in and user-registered type validators.
 * Supports both Map-style access (.get('uuid')) and
 * dot-notation access (validators.uuid) via a Proxy.
 */
export declare const validators: Map<string, (value: unknown) => boolean> & {
  [typeName: string]: ((value: unknown) => boolean) | undefined;
};

// ── defineType ────────────────────────────────────────────────────────────────

/**
 * Register a new named type validator in the global registry.
 * @param name - Non-empty string type name (e.g. 'phone', 'latitude')
 * @param checkFn - Returns true if the value matches the type
 */
export declare function defineType(
  name: string,
  checkFn: (value: unknown) => boolean
): void;

// ── validateRequired ──────────────────────────────────────────────────────────

/**
 * Check that all required fields declared in `inputContract` are present in `args`.
 * Returns null if all required fields are present, or a violation string otherwise.
 *
 * @param args - The input arguments object to validate
 * @param inputContract - Map of field names to { required?: boolean; ... } specs
 */
export declare function validateRequired(
  args: Record<string, unknown>,
  inputContract: Record<string, { required?: boolean; [key: string]: unknown }>
): string | null;
