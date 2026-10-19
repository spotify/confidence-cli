import type { ApiResponse } from '@spotify-confidence/core';
import { printApiError } from '@utils/api-error.js';
import { withAuth } from '@utils/auth.js';
import { printData } from './output.js';

/** Callers must validate arguments and input before invoking this helper, including dry-runs. */
export async function executeDataRequest(
  argv: Record<string, unknown>,
  request: (token: string) => Promise<ApiResponse<unknown>>,
  preview?: unknown,
): Promise<void> {
  if (argv['dry-run'] === true) {
    printData(preview ?? { dryRun: true }, argv);
    return;
  }

  await withAuth(async (_argv, token) => {
    try {
      const result = await request(token);
      if (!result.ok) {
        printApiError(result);
        return;
      }
      printData(result.data, argv);
    } catch (err) {
      printApiError({
        ok: false,
        status: 0,
        error: { code: 0, message: err instanceof Error ? err.message : 'Data request failed.' },
      });
    }
  })(argv);
}
