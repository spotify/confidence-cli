import { addRecordingRule } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withAuth } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { requireKeys, validateRange } from '@utils/validation.js';
import { tryHandleMcpError } from './format-mcp-error.js';

type RuleParams = {
  policy: string;
  'display-name': string;
  'targeting-key': string;
  'audience-percentage': number;
  'sample-rate': number;
  enabled: boolean;
};

export const addRule = withAuth(async function addRule(argv, token) {
  const params = resolveInput<RuleParams>(argv, [
    'policy',
    'display-name',
    'targeting-key',
    'audience-percentage',
    'sample-rate',
    'enabled',
  ]);

  requireKeys(params, ['policy', 'targeting-key']);
  validateRange(params['audience-percentage'], 'audience-percentage', 0, 100);
  validateRange(params['sample-rate'], 'sample-rate', 0, 1);

  const result = await addRecordingRule(token, {
    recordingPolicy: params.policy,
    displayName: params['display-name'],
    targetingKeySelector: params['targeting-key'],
    stableAudiencePercentage: params['audience-percentage'],
    sessionSampleRate: params['sample-rate'],
    enabled: params.enabled,
  });
  if (tryHandleMcpError(result)) return;
  printMcpResult(result, argv);
});
