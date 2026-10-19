import { isDebug } from '@spotify-confidence/core';

export function debug(label: string, detail: string): void {
  if (!isDebug()) return;
  process.stderr.write(`[debug] ${label}: ${detail}\n`);
}

type Handler<A extends unknown[], R> = (...args: A) => Promise<R>;

export function withDebug<A extends unknown[], R>(
  fn: Handler<A, R>,
  formatArgs?: (...args: NoInfer<A>) => string,
): Handler<A, R> {
  return async (...args) => {
    const name = fn.name || 'anonymous';
    const label = formatArgs ? `${name} ${formatArgs(...args)}` : name;
    const start = performance.now();
    debug('call', label);

    const result = await fn(...args);

    const elapsed = performance.now() - start;
    debug('timing', `${label} completed in ${elapsed.toFixed(0)}ms`);
    return result;
  };
}

export function debugMiddleware(argv: Record<string, unknown>): void {
  if (!argv.debug) return;

  process.env.DEBUG = 'true';

  const command = (argv._ as (string | number)[])?.join(' ') || 'unknown';
  debug('command', command);

  const args = Object.entries(argv)
    .filter(([k]) => !k.startsWith('$') && k !== '_' && k !== 'debug')
    .map(([k, v]) => `${k}=${redactSensitive(k, v)}`)
    .join(' ');

  if (args) {
    debug('args', args);
  }
}

function redactSensitive(key: string, value: unknown): string {
  const pattern =
    /config-json|configJson|from-file|fromFile|sql|token|password|secret|credential|key-id|keyId/i;

  return pattern.test(key) ? '[REDACTED]' : JSON.stringify(value);
}
