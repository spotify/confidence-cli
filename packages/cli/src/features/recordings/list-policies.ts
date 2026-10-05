import { extractText, parseToolJson } from '@spotify-confidence/core';
import { listRecordingPolicies } from '@network/index.js';
import { resolveFormat, formatJson, message, print, extractFlags } from '@output/index.js';
import { withAuth } from '../../utils/require-auth.js';
import { tryHandleMcpError } from './format-mcp-error.js';

type PolicyRow = {
  name: string;
  displayName: string;
  clients: string;
};

type ListResponse = {
  recordingPolicies: Array<{ name: string; displayName: string; clients: string[] }>;
  nextPageToken: string;
};

export const listPolicies = withAuth(async function listPolicies(argv, token) {
  const result = await listRecordingPolicies(token, {
    pageToken: argv['page-token'] as string | undefined,
  });
  if (tryHandleMcpError(result)) return;

  let data: ListResponse;
  try {
    data = parseToolJson<ListResponse>(result);
  } catch {
    message(extractText(result));
    return;
  }

  const flags = extractFlags(argv);
  const format = resolveFormat(flags);

  if (format === 'json') {
    const meta = data.nextPageToken ? { nextPageToken: data.nextPageToken } : undefined;
    message(
      formatJson(
        (data.recordingPolicies ?? []).map((p) => ({
          name: p.name,
          displayName: p.displayName || '',
          clients: p.clients ?? [],
        })),
        meta,
      ),
    );
    return;
  }

  print<PolicyRow>({
    data: (data.recordingPolicies ?? []).map((p) => ({
      name: p.name,
      displayName: p.displayName || '(unnamed)',
      clients: (p.clients ?? []).join(', '),
    })),
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'displayName', header: 'Display Name', width: 20 },
      { key: 'clients', header: 'Clients' },
    ],
    flags,
    empty: 'No recording policies found.',
  });

  if (data.nextPageToken) {
    message(`\nNext page: --page-token ${data.nextPageToken}`);
  }
});
