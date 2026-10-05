import { setRecordingRuleEnabled } from '@network/recordings.js';
import { fail, printMcpResult } from '@output/print.js';
import { requireAuth } from '../../utils/require-auth.js';

async function setEnabled(argv: Record<string, unknown>, enabled: boolean): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const rule = argv.rule as string;

  try {
    const result = await setRecordingRuleEnabled(token, rule, enabled);
    printMcpResult(result, argv);
  } catch (err) {
    fail((err as Error).message);
  }
}

export async function enableRule(argv: Record<string, unknown>): Promise<void> {
  return setEnabled(argv, true);
}

export async function disableRule(argv: Record<string, unknown>): Promise<void> {
  return setEnabled(argv, false);
}
