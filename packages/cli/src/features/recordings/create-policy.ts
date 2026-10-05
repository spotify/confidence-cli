import { createRecordingPolicy } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '../../utils/require-auth.js';
import { resolveTargetFile } from '../../utils/read-json-file.js';

type PolicyParams = {
  'display-name': string;
  'client-name': string;
};

export const createPolicy = withAuth(async function createPolicy(argv, token) {
  const params = resolveTargetFile<PolicyParams>(argv, () => ({
    'display-name': argv['display-name'] as string,
    'client-name': argv['client-name'] as string,
  }));

  const result = await createRecordingPolicy(token, params['display-name'], params['client-name']);
  printMcpResult(result, argv);
});
