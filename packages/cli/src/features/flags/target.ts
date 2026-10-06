import { getFlag, addTargetingRule } from '@network/index.js';
import { validateAllocations } from '@utils/validation.js';
import {
  resolveFormat,
  formatJson,
  extractFlags,
  fail,
  message,
  print,
  printMcpResult,
} from '@output/index.js';
import { withAuth } from '@utils/index.js';
import { resolveInput } from '@input/index.js';

function parseAllocations(spec: string): Record<string, number> {
  const allocations: Record<string, number> = {};
  for (const pair of spec.split(',')) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) {
      throw new Error(`Invalid allocation format "${pair}". Expected "variant:percentage".`);
    }
    const variant = pair.slice(0, colonIdx).trim();
    const pct = Number(pair.slice(colonIdx + 1).trim());
    if (!variant || Number.isNaN(pct)) {
      throw new Error(`Invalid allocation format "${pair}". Expected "variant:percentage".`);
    }
    allocations[variant] = pct;
  }
  validateAllocations(allocations);
  return allocations;
}

export const targetFlagCmd = withAuth(async function targetFlagCmd(argv, token) {
  const flagKey = argv['flag-key'] as string;

  let allocations: Record<string, number> | undefined;
  let targetingKey = argv['targeting-key'] as string | undefined;

  if (argv['from-file']) {
    const opts = resolveInput(argv, ['targeting-key', 'variant-allocations']);
    allocations = (opts['variant-allocations'] as Record<string, number>) ?? {};
    targetingKey = opts['targeting-key'] as string | undefined;

    if (Object.keys(allocations).length === 0) {
      fail('File must contain "variantAllocations" (e.g. {"variantAllocations": {"on": 80}}).');
      return;
    }
  } else if (argv.add) {
    allocations = parseAllocations(argv.add as string);
  }

  if (allocations) {
    validateAllocations(allocations);

    if (argv['dry-run']) {
      message(JSON.stringify({ flagKey, variantAllocations: allocations, targetingKey }, null, 2));
      return;
    }

    const result = await addTargetingRule(token, flagKey, {
      variantAllocations: allocations,
      targetingKey,
    });
    printMcpResult(result, argv);
    return;
  }

  const result = await getFlag(token, flagKey);

  if (!result.ok) {
    fail(result.error.message);
    return;
  }

  const flag = result.data;
  const flags = extractFlags(argv);
  const format = resolveFormat(flags);
  const rules = flag.rules ?? [];

  if (format === 'json') {
    message(formatJson(rules));
    return;
  }

  if (rules.length === 0) {
    message('No targeting rules configured.');
    return;
  }

  print({
    data: rules.map((r) => ({
      name: r.name.split('/').pop() ?? r.name,
      enabled: String(r.enabled ?? false),
      targetingKey: r.targetingKeySelector ?? '',
    })),
    columns: [
      { key: 'name', header: 'Rule' },
      { key: 'enabled', header: 'Enabled' },
      { key: 'targetingKey', header: 'Targeting Key' },
    ],
    flags,
    empty: 'No targeting rules configured.',
  });
});
