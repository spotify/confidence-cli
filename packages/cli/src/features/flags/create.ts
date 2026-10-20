import { createFlag } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withCrossCutting } from '@composition';
import { dryRunGuard } from '@utils/index.js';
import { resolveInput } from '@input/index.js';

export const createFlagCmd = withCrossCutting(async function createFlagCmd(argv, token) {
  const flagKey = argv['flag-key'] as string;
  const opts = resolveInput(argv, ['description', 'variant', 'client']);
  const description = opts.description as string | undefined;
  const variants = (opts.variant as string[]) ?? [];
  const client = opts.client as string | undefined;

  if (dryRunGuard(argv, { flagKey, description, variants, client })) return;

  const result = await createFlag(token, flagKey, {
    description,
    variants: variants.length > 0 ? variants : undefined,
    client,
  });
  printMcpResult(result, argv);
});
