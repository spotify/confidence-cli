import { addRecordingRule } from '@network/recordings.js';
import { fail, printMcpResult } from '@output/print.js';
import { requireAuth } from '../../utils/require-auth.js';
import { readJsonFile } from '../../utils/read-json-file.js';

type RuleParams = {
  policy: string;
  'display-name'?: string;
  'targeting-key': string;
  'audience-percentage'?: number;
  'sample-rate'?: number;
  enabled?: boolean;
};

export async function addRule(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  let params: RuleParams;
  try {
    const fromFile = argv['from-file'] as string | undefined;
    if (fromFile) {
      params = readJsonFile<RuleParams>(fromFile);
    } else {
      params = {
        policy: argv.policy as string,
        'display-name': argv['display-name'] as string | undefined,
        'targeting-key': argv['targeting-key'] as string,
        'audience-percentage': argv['audience-percentage'] as number | undefined,
        'sample-rate': argv['sample-rate'] as number | undefined,
        enabled: argv.enabled as boolean | undefined,
      };
    }
  } catch (err) {
    fail((err as Error).message);
    return;
  }

  try {
    const result = await addRecordingRule(token, {
      recordingPolicy: params.policy,
      displayName: params['display-name'] ?? 'Record all visitors',
      targetingKeySelector: params['targeting-key'],
      stableAudiencePercentage: params['audience-percentage'] ?? 100,
      sessionSampleRate: params['sample-rate'] ?? 1,
      enabled: params.enabled ?? true,
    });
    printMcpResult(result, argv);
  } catch (err) {
    fail((err as Error).message);
  }
}
