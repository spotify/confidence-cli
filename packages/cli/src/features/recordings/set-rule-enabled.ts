import { setRecordingRuleEnabled } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '../../utils/require-auth.js';

function makeToggle(enabled: boolean) {
  return withAuth(async function toggle(argv, token) {
    const result = await setRecordingRuleEnabled(token, argv.rule as string, enabled);
    printMcpResult(result, argv);
  });
}

export const enableRule = makeToggle(true);
export const disableRule = makeToggle(false);
