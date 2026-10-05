import { createRecordingPolicy } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withAuth } from '@utils/require-auth.js';
import { resolveInput } from '@input/index.js';
import { requireKeys } from '@utils/validation.js';
import { tryHandleMcpError } from './format-mcp-error.js';

type PolicyParams = {
  'display-name': string;
  'client-name': string;
};

export const createPolicy = withAuth(async function createPolicy(argv, token) {
  const params = resolveInput<PolicyParams>(argv, ['display-name', 'client-name']);

  requireKeys(params, ['display-name', 'client-name']);

  const result = await createRecordingPolicy(token, params['display-name'], params['client-name']);
  if (tryHandleMcpError(result)) return;
  printMcpResult(result, argv);
});
