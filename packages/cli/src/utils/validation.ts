export function requireKeys<T extends Record<string, unknown>>(
  params: T,
  keys: (keyof T & string)[],
): void {
  const missing = keys.filter((k) => params[k] == null || params[k] === '');
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

export function validateRange(value: unknown, name: string, min: number, max: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} must be a number`);
  }

  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
}
