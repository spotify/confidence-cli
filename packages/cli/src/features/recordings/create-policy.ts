import { createRecordingPolicy } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '../../utils/require-auth.js';
import { resolveTargetFile } from '../../utils/read-json-file.js';
import { requireKeys } from '../../utils/validation.js';
import { tryHandleMcpError } from './format-mcp-error.js';

type PolicyParams = {
  'display-name': string;
  'client-name': string;
};

export const createPolicy = withAuth(async function createPolicy(argv, token) {
  const params = resolveTargetFile<PolicyParams>(
    argv,
    () => ({
      'display-name': argv['display-name'] as string,
      'client-name': argv['client-name'] as string,
    }),
    { merge: true },
  );

  requireKeys(params, ['display-name', 'client-name']);

  const result = await createRecordingPolicy(token, params['display-name'], params['client-name']);
  if (tryHandleMcpError(result)) return;
  printMcpResult(result, argv);
});
