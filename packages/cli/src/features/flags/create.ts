import { createFlag } from '@network/index.js';
import { message, printMcpResult } from '@output/index.js';
import { withAuth } from '@utils/require-auth.js';
import { resolveInput } from '@input/index.js';

export const createFlagCmd = withAuth(async function createFlagCmd(argv, token) {
  const flagKey = argv['flag-key'] as string;
  const opts = resolveInput(argv, ['description', 'variant', 'client']);
  const description = opts.description as string | undefined;
  const variants = (opts.variant as string[]) ?? [];
  const client = opts.client as string | undefined;

  if (argv['dry-run']) {
    message(JSON.stringify({ flagKey, description, variants, client }, null, 2));
    return;
  }

  const result = await createFlag(token, flagKey, {
    description,
    variants: variants.length > 0 ? variants : undefined,
    client,
  });
  printMcpResult(result, argv);
});
