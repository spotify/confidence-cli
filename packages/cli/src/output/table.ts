type Column<T> = {
  key: keyof T & string;
  header: string;
  width?: number;
};

export function formatTable<T extends Record<string, unknown>>(
  rows: T[],
  columns: Column<T>[],
): string {
  if (rows.length === 0) return 'No results.';

  const widths = columns.map((col) => {
    const headerLen = col.header.length;
    const maxDataLen = rows.reduce((max, row) => {
      const val = String(row[col.key] ?? '');
      return Math.max(max, val.length);
    }, 0);
    return col.width ?? Math.max(headerLen, maxDataLen);
  });

  const header = columns.map((col, i) => col.header.padEnd(widths[i])).join('  ');
  const separator = widths.map((w) => '─'.repeat(w)).join('──');
  const body = rows.map((row) =>
    columns.map((col, i) => String(row[col.key] ?? '').padEnd(widths[i])).join('  '),
  );

  return [header, separator, ...body].join('\n');
}
