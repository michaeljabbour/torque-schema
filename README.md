# @torquedev/schema

Type validators and contract checking for Torque. Zero dependencies.

---

## Install

```bash
npm install @torquedev/schema
```

**From source (monorepo / local dev):**

```json
"dependencies": {
  "@torquedev/schema": "github:torque-framework/torque-schema"
}
```

---

## Quick Start

```js
import { createTypeValidator, validateRequired } from '@torquedev/schema';

// --- Type validation ---
const validate = createTypeValidator();

validate('uuid', '550e8400-e29b-41d4-a716-446655440000', 'userId');
// => null  (valid)

validate('uuid', 'not-a-uuid', 'userId');
// => "field 'userId': expected uuid, got string"

validate('integer', 3.14, 'count');
// => "field 'count': expected integer, got number"

// --- Required field checking ---
const inputContract = {
  userId: { type: 'uuid', required: true },
  name:   { type: 'string', required: true },
  bio:    { type: 'string', required: false },
};

validateRequired({ userId: '550e8400-e29b-41d4-a716-446655440000', name: 'Alice' }, inputContract);
// => null  (all required fields present)

validateRequired({ userId: null, name: 'Alice' }, inputContract);
// => "required field 'userId' is missing"
```

---

## Built-in Types

| Type name    | Alias      | Validates                                              |
|--------------|------------|--------------------------------------------------------|
| `string`     | `text`     | `typeof v === 'string'`                                |
| `uuid`       | —          | RFC 4122 UUID string (versions 1–5)                    |
| `integer`    | —          | `Number.isInteger(v)`                                  |
| `float`      | `decimal`  | `typeof v === 'number' && Number.isFinite(v)` (includes integers) |
| `boolean`    | —          | `typeof v === 'boolean'`                               |
| `timestamp`  | `datetime` | ISO 8601 string that `Date.parse()` can resolve        |
| `email`      | —          | Non-whitespace string containing `@` and a `.` domain  |
| `url`        | —          | Any string parseable by the built-in `URL` constructor |
| `object`     | —          | Non-null, non-array object (includes class instances)  |
| `array`      | —          | `Array.isArray(v)`                                     |

Aliases map to the same validator function as their primary name. Both names are interchangeable everywhere a type name is accepted.

---

## Array-of-Type Syntax

Append `[]` to any registered type name to validate that a value is an **array whose every element** passes that type check.

```js
const validate = createTypeValidator();

// Valid: array of strings
validate('string[]', ['hello', 'world'], 'tags');
// => null

// Invalid: not an array
validate('uuid[]', '550e8400-e29b-41d4-a716-446655440000', 'ids');
// => "field 'ids': expected array, got string"

// Invalid: wrong element type
validate('uuid[]', ['550e8400-e29b-41d4-a716-446655440000', 42], 'ids');
// => "field 'ids[1]': expected uuid, got number"

// Works with aliases too
validate('text[]', ['a', 'b'], 'words');
// => null
```

The `[]` suffix also works with any custom types you register.

---

## Custom Type Registration

There are two equivalent ways to add a custom type:

### `validate.registerType` (instance method)

Attach the custom type to the validator instance you already have. Because all instances share the same global type map, the new type is immediately available everywhere.

```js
const validate = createTypeValidator();

validate.registerType('phone', (v) =>
  typeof v === 'string' && /^\+?[1-9]\d{1,14}$/.test(v)
);

validate('phone', '+14155550100', 'mobile');
// => null

validate('phone', 'not-a-phone', 'mobile');
// => "field 'mobile': expected phone, got string"

// Array syntax works automatically
validate('phone[]', ['+14155550100', '+442071234567'], 'contacts');
// => null
```

### `defineType` (direct export)

Import and call at module load time, before any validator instances are created.

```js
import { defineType, createTypeValidator } from '@torquedev/schema';

defineType('positiveInt', (v) => Number.isInteger(v) && v > 0);

const validate = createTypeValidator();

validate('positiveInt', 5, 'quantity');
// => null

validate('positiveInt', -1, 'quantity');
// => "field 'quantity': expected positiveInt, got number"
```

**Constraints:**
- `name` must be a non-empty string — throws `Error` otherwise.
- `checkFn` must be a function — throws `Error` otherwise.
- Registering an existing name overwrites it (useful for overriding built-ins in tests).

---

## API Reference

### `createTypeValidator()`

```ts
function createTypeValidator(): ValidateFunction
```

Returns a `validate` function with the following signature:

```ts
validate(declaredType: string, actualValue: unknown, fieldName: string): string | null
```

- Returns `null` when the value passes the type check.
- Returns a human-readable violation string on failure, e.g. `"field 'userId': expected uuid, got string"`.
- Supports the `[]` suffix for array-of-type validation.
- Exposes `validate.registerType(name, checkFn)` — a convenience wrapper around `defineType`.

---

### `validateRequired(args, inputContract)`

```ts
function validateRequired(
  args: Record<string, unknown>,
  inputContract: Record<string, { required?: boolean; [key: string]: unknown }>
): string | null
```

Iterates the contract's fields. For each field with `required: true`, checks that `args[fieldName]` is neither `undefined` nor `null`.

- Returns `null` when all required fields are present.
- Returns `"required field '<name>' is missing"` for the first missing field found.
- Fields without `required: true` (or with `required: false`) are skipped entirely.

---

### `validators` (Map proxy)

```ts
const validators: Map<string, (v: unknown) => boolean>
```

A `Proxy` wrapping the internal `Map` of type-name → validator function. Supports both access styles:

```js
import { validators } from '@torquedev/schema';

validators.get('string');   // Map-style
validators.string;          // Dot-notation shorthand
validators.has('uuid');     // true
```

All native `Map` methods (`get`, `set`, `has`, `delete`, `forEach`, `entries`, etc.) work normally. Dot-notation falls back to `Map.get` for string keys.

> **Note:** `validators` is the shared global map. Mutations (via `defineType` or `registerType`) affect all validator instances and are process-wide.

---

### `defineType(name, checkFn)`

```ts
function defineType(name: string, checkFn: (v: unknown) => boolean): void
```

Registers a type in the global validators map. Throws if `name` is not a non-empty string or if `checkFn` is not a function. See [Custom Type Registration](#custom-type-registration) for examples.

---

## Kernel Integration

`@torquedev/schema` is designed to be wired into the Torque kernel via the `typeValidator` option in `boot.js`. When provided, the kernel uses it to enforce contracts at five points in the request lifecycle:

```js
// boot.js
import { createTypeValidator } from '@torquedev/schema';

const typeValidator = createTypeValidator();

const kernel = await createKernel({
  typeValidator,
  // ... other options
});
```

### 5 Validation Behaviors

| # | Behavior | When it runs |
|---|----------|-------------|
| 1 | **Input args** | Before a command or query handler executes — validates every field in the handler's `input` contract |
| 2 | **Output types** | After a handler returns — validates the result against the handler's `output` contract |
| 3 | **Event payload types** | When an event is emitted — validates each payload field against the event's declared contract |
| 4 | **Extra fields detection** | Flags fields present in the incoming args that are not declared in the input contract |
| 5 | **Nullable enforcement** | Ensures fields declared non-nullable are not `null` even when their type check would otherwise pass |

When a validation behavior triggers, the kernel rejects the operation and surfaces the violation string returned by `validate()` or `validateRequired()`, preventing bad data from propagating into the domain layer.

---

## Testing

```bash
npm test
```

Runs 117 tests across four suites using Node's built-in test runner:

| Suite | File |
|-------|------|
| Public exports | `test/index.test.js` |
| Required field checking | `test/required.test.js` |
| Built-in type validators | `test/types.test.js` |
| Type validation logic | `test/validator.test.js` |

No external test framework required. Tests run with:

```bash
node --test 'test/*.test.js'
```

---

## Torque Framework

`@torquedev/schema` is part of the [Torque Framework](https://github.com/torque-framework/torque) — a modular, kernel-based backend framework for Node.js.

## License

MIT — see [LICENSE](./LICENSE)
