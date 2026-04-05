export function validateRequired(args, inputContract) {
  for (const [fieldName, spec] of Object.entries(inputContract)) {
    if (!spec.required) continue;
    if (args[fieldName] === undefined || args[fieldName] === null) {
      return `required field '${fieldName}' is missing`;
    }
  }
  return null;
}
