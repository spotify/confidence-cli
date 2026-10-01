export type OutputFormat = 'json' | 'table' | 'plain';

export function resolveFormat({
  json,
  output,
}: {
  json?: boolean;
  output?: OutputFormat;
}): OutputFormat {
  if (json) return 'json';
  if (output) return output;
  return process.stdout.isTTY ? 'table' : 'json';
}
