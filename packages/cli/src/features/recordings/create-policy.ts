import { createRecordingPolicy } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withCrossCutting } from '@composition';
import { dryRunGuard } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { requireKeys } from '@utils/validation.js';
import { tryHandleMcpError } from './format-mcp-error.js';

type PolicyParams = {
  'display-name': string;
  'client-name': string;
};

export const createPolicy = withCrossCutting(async function createPolicy(argv, token) {
  const params = resolveInput<PolicyParams>(argv, ['display-name', 'client-name']);
  requireKeys(params, ['display-name', 'client-name']);

  const payload = { displayName: params['display-name'], clientName: params['client-name'] };
  if (dryRunGuard(argv, payload)) return;

  const result = await createRecordingPolicy(token, payload.displayName, payload.clientName);
  if (tryHandleMcpError(result)) return;
  printMcpResult(result, argv);
});
