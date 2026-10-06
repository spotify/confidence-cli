import { resolveFlag } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withAuth } from '@utils/index.js';

function parseContextPair(spec: string): [string, string] {
  const eqIndex = spec.indexOf('=');
  if (eqIndex === -1) {
    throw new Error(`Invalid context format "${spec}". Expected "key=value".`);
  }

  const key = spec.slice(0, eqIndex).trim();
  const value = spec.slice(eqIndex + 1).trim();

  if (!key) {
    throw new Error(`Invalid context format "${spec}". Key cannot be empty.`);
  }

  return [key, value];
}

export const resolveFlagCmd = withAuth(async function resolveFlagCmd(argv, token) {
  const flagKey = argv['flag-key'] as string;
  const entity = argv.entity as string;
  const entityValue = argv['entity-value'] as string;
  const client = argv.client as string | undefined;
  const contextSpecs = (argv.context as string[] | undefined) ?? [];

  let context: Record<string, string> | undefined;
  if (contextSpecs.length > 0) {
    context = Object.fromEntries(contextSpecs.map(parseContextPair));
  }

  const result = await resolveFlag(token, flagKey, { entity, entityValue, client, context });
  printMcpResult(result, argv);
});
