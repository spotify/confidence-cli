import { extractText, parseToolJson } from '@spotify-confidence/core';
import { listRecordingPolicies } from '@network/recordings.js';
import { message, fail, print, extractFlags } from '@output/print.js';
import { requireAuth } from '../../utils/require-auth.js';
import { handleMcpError } from './format-mcp-error.js';

type PolicyRow = {
  name: string;
  displayName: string;
  clients: string;
};

type ListResponse = {
  recordingPolicies: Array<{ name: string; displayName: string; clients: string[] }>;
  nextPageToken: string;
};

export async function listPolicies(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  try {
    const result = await listRecordingPolicies(token, {
      pageToken: argv['page-token'] as string | undefined,
    });
    if (handleMcpError(result)) return;

    let data: ListResponse;
    try {
      data = parseToolJson<ListResponse>(result);
    } catch {
      message(extractText(result));
      return;
    }

    print<PolicyRow>({
      data: data.recordingPolicies.map((p) => ({
        name: p.name,
        displayName: p.displayName || '(unnamed)',
        clients: p.clients.join(', '),
      })),
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'displayName', header: 'Display Name', width: 20 },
        { key: 'clients', header: 'Clients' },
      ],
      flags: extractFlags(argv),
      empty: 'No recording policies found.',
    });

    if (data.nextPageToken) {
      message(`\nNext page: --page-token ${data.nextPageToken}`);
    }
  } catch (err) {
    fail((err as Error).message);
  }
}
