export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function ensureJsonString(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}
