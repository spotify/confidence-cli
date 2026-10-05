const FIELD_TYPES = ['string', 'int', 'double', 'bool', 'struct'] as const;

export function parseFieldArg(spec: string): [string, Record<string, unknown>] {
  const colonIndex = spec.indexOf(':');
  if (colonIndex === -1) {
    throw new Error(`Invalid field format "${spec}". Expected "name:type" (e.g. "page:string").`);
  }

  const name = spec.slice(0, colonIndex).trim();
  const type = spec
    .slice(colonIndex + 1)
    .trim()
    .toLowerCase();

  if (!name) {
    throw new Error(`Invalid field format "${spec}". Field name cannot be empty.`);
  }

  if (!FIELD_TYPES.includes(type as (typeof FIELD_TYPES)[number])) {
    throw new Error(
      `Unknown field type "${type}" in "${spec}". Supported types: ${FIELD_TYPES.join(', ')}.`,
    );
  }

  const schemaKey = `${type}Schema`;
  return [name, { [schemaKey]: {} }];
}
