export function ensureJsonString(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function validateJsonString(value: string, label?: string): string {
  try {
    JSON.parse(value);
    return value;
  } catch {
    const preamble = 'Invalid JSON';
    const origin = label ? ` for ${label}` : '';
    throw new Error(`${preamble}${origin}: ${value}`);
  }
}
