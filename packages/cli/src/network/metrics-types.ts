/** Small response/input guards; resource-specific validation belongs to each feature. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function requireRecord(value: unknown, label = 'Value'): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  return value;
}

export function requireString(value: unknown, label = 'Value'): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

/** A qualified resource name must contain exactly one unescaped resource ID. */
export function resourcePath(name: string, collection: string): string {
  if (!/^[A-Za-z][A-Za-z0-9]*$/u.test(collection)) {
    throw new Error('Invalid resource collection.');
  }
  const prefix = `${collection}/`;
  if (!name.startsWith(prefix) || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/u.test(name.slice(prefix.length))) {
    throw new Error(`Resource name must be ${collection}/<id> with a single valid ID.`);
  }
  return `/v1/${name}`;
}
