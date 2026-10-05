import { extractText, parseToolJson } from '@spotify-confidence/core';
import { getRecordingPolicy } from '@network/recordings.js';
import { message, fail, print, extractFlags } from '@output/print.js';
import { requireAuth } from '../../utils/require-auth.js';
import { handleMcpError } from './format-mcp-error.js';

type PolicyDetail = {
  name: string;
  displayName: string;
  clients: string[];
  rules: Array<{ name: string; displayName: string; enabled: boolean }>;
};

export async function getPolicy(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const policy = argv.policy as string;

  try {
    const result = await getRecordingPolicy(token, policy);
    if (handleMcpError(result)) return;

    let data: PolicyDetail;
    try {
      data = parseToolJson<PolicyDetail>(result);
    } catch {
      message(extractText(result));
      return;
    }

    const flags = extractFlags(argv);

    print({
      data: {
        Name: data.name,
        'Display Name': data.displayName || '(unnamed)',
        Clients: data.clients.join(', '),
      },
      columns: [
        { key: 'key', header: 'Field', width: 14 },
        { key: 'value', header: 'Value' },
      ],
      flags,
    });

    if (data.rules?.length) {
      message('');
      message('Rules:');
      print({
        data: data.rules.map((r) => ({
          name: r.name,
          displayName: r.displayName || '(unnamed)',
          enabled: r.enabled ? 'yes' : 'no',
        })),
        columns: [
          { key: 'name', header: 'Name' },
          { key: 'displayName', header: 'Display Name', width: 20 },
          { key: 'enabled', header: 'Enabled', width: 7 },
        ],
        flags,
        empty: 'No rules.',
      });
    } else {
      message('\nNo rules configured.');
    }
  } catch (err) {
    fail((err as Error).message);
  }
}
