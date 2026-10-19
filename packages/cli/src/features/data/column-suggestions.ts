import { suggestFactTableColumns } from '@network/metrics-column-suggestions.js';
import { readColumnSuggestionsInput } from './column-suggestions-input.js';
import { executeDataRequest } from './request.js';

export async function suggestColumns(argv: Record<string, unknown>): Promise<void> {
  const body = readColumnSuggestionsInput(argv['from-file']);
  await executeDataRequest(argv, (token) => suggestFactTableColumns(token, body), {
    method: 'POST',
    path: '/v1/factTables:suggestFactTableColumns',
    body,
  });
}
