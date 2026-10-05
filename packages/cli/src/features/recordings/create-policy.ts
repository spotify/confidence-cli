import { createRecordingPolicy } from '@network/recordings.js';
import { fail, printMcpResult } from '@output/print.js';
import { requireAuth } from '../../utils/require-auth.js';
import { readJsonFile } from '../../utils/read-json-file.js';

type PolicyParams = {
  'display-name': string;
  'client-name': string;
};

export async function createPolicy(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  let params: PolicyParams;
  try {
    const fromFile = argv['from-file'] as string | undefined;
    if (fromFile) {
      params = readJsonFile<PolicyParams>(fromFile);
    } else {
      params = {
        'display-name': argv['display-name'] as string,
        'client-name': argv['client-name'] as string,
      };
    }
  } catch (err) {
    fail((err as Error).message);
    return;
  }

  try {
    const result = await createRecordingPolicy(
      token,
      params['display-name'],
      params['client-name'],
    );
    printMcpResult(result, argv);
  } catch (err) {
    fail((err as Error).message);
  }
}
