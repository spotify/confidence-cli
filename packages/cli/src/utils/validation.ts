export function requireKeys<T extends Record<string, unknown>>(
  params: T,
  keys: (keyof T & string)[],
): void {
  const missing = keys.filter((k) => params[k] == null || params[k] === '');
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}
