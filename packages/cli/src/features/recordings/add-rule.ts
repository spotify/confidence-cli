import { addRecordingRule } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '../../utils/require-auth.js';
import { resolveTargetFile } from '../../utils/read-json-file.js';
import { requireKeys } from '../../utils/validation.js';

type RuleParams = {
  policy: string;
  'display-name': string;
  'targeting-key': string;
  'audience-percentage': number;
  'sample-rate': number;
  enabled: boolean;
};

export const addRule = withAuth(async function addRule(argv, token) {
  const params = resolveTargetFile<RuleParams>(
    argv,
    () => ({
      policy: argv.policy as string,
      'display-name': argv['display-name'] as string,
      'targeting-key': argv['targeting-key'] as string,
      'audience-percentage': argv['audience-percentage'] as number,
      'sample-rate': argv['sample-rate'] as number,
      enabled: argv.enabled as boolean,
    }),
    { merge: true },
  );

  requireKeys(params, ['policy', 'targeting-key']);

  const result = await addRecordingRule(token, {
    recordingPolicy: params.policy,
    displayName: params['display-name'],
    targetingKeySelector: params['targeting-key'],
    stableAudiencePercentage: params['audience-percentage'],
    sessionSampleRate: params['sample-rate'],
    enabled: params.enabled,
  });
  printMcpResult(result, argv);
});
