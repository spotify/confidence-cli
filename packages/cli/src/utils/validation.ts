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

export function validateAllocations(
  allocations: Record<string, number>,
  opts: { label?: string; targetTotal?: number } = {},
): void {
  const { label = 'allocation', targetTotal = 100 } = opts;
  for (const [key, percentage] of Object.entries(allocations)) {
    validateRange(percentage, `${label} for "${key}"`, 0, targetTotal);
  }

  const total = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  if (total > targetTotal) {
    throw new Error(`Total ${label} is ${total}%, must not exceed ${targetTotal}%.`);
  }
}
