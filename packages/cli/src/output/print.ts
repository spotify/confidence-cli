import type { OutputFormat } from './detect.js';
import { resolveFormat } from './detect.js';
import { formatJson } from './json.js';
import { formatTable } from './table.js';

type Column<T> = {
  key: keyof T & string;
  header: string;
  width?: number;
};

type FormatFlags = {
  json?: boolean;
  output?: OutputFormat;
};

type PrintTableOpts<T extends Record<string, unknown>> = {
  data: T[];
  columns: Column<T>[];
  flags: FormatFlags;
};

type PrintKeyValueOpts = {
  data: Record<string, unknown>;
  columns: [Column<{ key: string; value: string }>, Column<{ key: string; value: string }>];
  flags: FormatFlags;
};

function write(text: string): void {
  process.stdout.write(text + '\n');
}

export function print<T extends Record<string, unknown>>(opts: PrintTableOpts<T>): void;
export function print(opts: PrintKeyValueOpts): void;
export function print<T extends Record<string, unknown>>(
  opts: PrintTableOpts<T> | PrintKeyValueOpts,
): void {
  const format = resolveFormat(opts.flags);

  if (format === 'json') {
    write(formatJson(opts.data));
    return;
  }

  if (Array.isArray(opts.data)) {
    write(formatTable(opts.data, opts.columns as Column<T>[]));
    return;
  }

  const entries = Object.entries(opts.data);
  if (entries.length === 0) {
    write('No results.');
    return;
  }

  const rows = entries.map(([key, value]) => ({ key, value: String(value ?? '') }));
  write(formatTable(rows, opts.columns as Column<{ key: string; value: string }>[]));
}

export function extractFlags(argv: Record<string, unknown>): FormatFlags {
  return {
    json: argv.json as boolean | undefined,
    output: argv.output as OutputFormat | undefined,
  };
}
