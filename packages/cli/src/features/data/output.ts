import { inspect } from 'node:util';
import { isRecord } from '@network/metrics-types.js';
import { extractFlags, formatJson, message, print, resolveFormat } from '@output/index.js';

/** Preserve the full response in JSON; render generic resources as key/value rows otherwise. */
export function printData(data: unknown, argv: Record<string, unknown>): void {
  const flags = extractFlags(argv);
  if (resolveFormat(flags) === 'json') {
    message(formatJson(data));
    return;
  }

  const fields = isRecord(data) ? data : { value: data };
  const rows = Object.entries(fields).map(([field, value]) => ({
    field,
    value: typeof value === 'string' ? value : inspect(value, { depth: null, colors: false }),
  }));
  print({
    data: rows,
    columns: [
      { key: 'field', header: 'Field' },
      { key: 'value', header: 'Value' },
    ],
    flags,
  });
}
