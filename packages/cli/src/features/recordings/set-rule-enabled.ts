import { setRecordingRuleEnabled } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '../../utils/require-auth.js';
import { tryHandleMcpError } from './format-mcp-error.js';

function makeToggle(enabled: boolean) {
  return withAuth(async function toggle(argv, token) {
    const result = await setRecordingRuleEnabled(token, argv.rule as string, enabled);
    if (tryHandleMcpError(result)) return;
    printMcpResult(result, argv);
  });
}

export const enableRule = makeToggle(true);
export const disableRule = makeToggle(false);
