import { extractText, type CallToolResult } from '@spotify-confidence/core';
import type { OutputFormat } from './detect.js';
import { resolveFormat } from './detect.js';
import { formatJson } from './json.js';
import { formatTable } from './table.js';

type Column<T> = {
  key: keyof T & string;
  header: string;
  width?: number;
};

type KeyValuePair = {
  key: string;
  value: string;
};

type FormatFlags = {
  json?: boolean;
  output?: OutputFormat;
};

type PrintTableOpts<T extends Record<string, unknown>> = {
  data: T[];
  columns: Column<T>[];
  flags: FormatFlags;
  empty?: string;
};

type PrintKeyValueOpts = {
  data: Record<string, unknown>;
  columns: [Column<KeyValuePair>, Column<KeyValuePair>];
  flags: FormatFlags;
  empty?: string;
};

export function message(text: string): void {
  process.stdout.write(text + '\n');
}

export function error(text: string): void {
  process.stderr.write(text + '\n');
}

export function warn(text: string): void {
  process.stderr.write(`Warning: ${text}\n`);
}

export function fail(text: string): void {
  error(text);
  process.exitCode = 1;
}

export function extractFlags(argv: Record<string, unknown>): FormatFlags {
  return {
    json: argv.json as boolean | undefined,
    output: argv.output as OutputFormat | undefined,
  };
}

export function printMcpResult(result: CallToolResult, argv: Record<string, unknown>): void {
  const text = extractText(result);
  const format = resolveFormat(extractFlags(argv));
  if (format === 'json') {
    message(formatJson(safeParseJson(text)));
  } else {
    message(text);
  }
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function print<T extends Record<string, unknown>>(opts: PrintTableOpts<T>): void;
export function print(opts: PrintKeyValueOpts): void;
export function print<T extends Record<string, unknown>>(
  opts: PrintTableOpts<T> | PrintKeyValueOpts,
): void {
  const format = resolveFormat(opts.flags);

  if (format === 'json') {
    message(formatJson(opts.data));
    return;
  }

  const rows = intoRows(opts.data) as T[];

  if (rows.length === 0) {
    message(opts.empty ?? 'No results.');
    return;
  }

  message(formatTable(rows, opts.columns as Column<T>[]));
}

function intoRows(
  data: Record<string, unknown> | Record<string, unknown>[],
): Record<string, unknown>[] {
  return Array.isArray(data)
    ? data
    : Object.entries(data).map(([key, value]) => ({ key, value: String(value ?? '') }));
}
