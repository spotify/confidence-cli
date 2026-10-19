import type { ApiResponse } from '@spotify-confidence/core';
import { requireRecord, requireString } from './metrics-types.js';
import { metricsRequest } from './metrics.js';

// confidence/metrics/v1/metrics.proto: ColumnType, in numeric enum order.
export const COLUMN_TYPES = [
  'COLUMN_TYPE_UNSPECIFIED',
  'COLUMN_TYPE_STRING',
  'COLUMN_TYPE_INT32',
  'COLUMN_TYPE_INT64',
  'COLUMN_TYPE_DOUBLE',
  'COLUMN_TYPE_BOOLEAN',
  'COLUMN_TYPE_DATE',
  'COLUMN_TYPE_TIMESTAMP',
  'COLUMN_TYPE_BYTES',
  'COLUMN_TYPE_TIMESTAMP_WITHOUT_TIMEZONE',
  'COLUMN_TYPE_DECIMAL',
  'COLUMN_TYPE_HLL_SKETCH',
] as const;

export type SuggestFactTableColumnsRequest = {
  schema: {
    name: string;
    type?: (typeof COLUMN_TYPES)[number] | number;
    repeated?: boolean;
  }[];
};

/** Request classifications only; this endpoint does not create or update fact tables. */
export async function suggestFactTableColumns(
  token: string,
  body: SuggestFactTableColumnsRequest,
): Promise<ApiResponse<Record<string, unknown>>> {
  const result = await metricsRequest<unknown>(token, {
    path: '/v1/factTables:suggestFactTableColumns',
    method: 'POST',
    body,
  });
  if (!result.ok) return result;

  const response = requireRecord(result.data, 'Column suggestions response');
  const hasSuggestion = Object.hasOwn(response, 'suggestion');
  const hasError = Object.hasOwn(response, 'error');
  if (hasSuggestion === hasError) {
    throw new Error(
      'Invalid column suggestions response: expected exactly one of suggestion or error.',
    );
  }
  if (hasError) {
    throw new Error(
      `Column suggestions failed: ${requireString(response.error, 'Suggestion error')}`,
    );
  }
  requireRecord(response.suggestion, 'Column suggestion');
  return { ok: true, data: response };
}
