import { extractText, parseToolJson } from '@spotify-confidence/core';
import { getRecordingPolicy } from '@network/index.js';
import { resolveFormat, formatJson, message, print, extractFlags } from '@output/index.js';
import { withAuth } from '@utils/index.js';
import { tryHandleMcpError } from './format-mcp-error.js';

type PolicyDetail = {
  name: string;
  displayName: string;
  clients: string[];
  rules: Array<{ name: string; displayName: string; enabled: boolean }>;
};

export const getPolicy = withAuth(async function getPolicy(argv, token) {
  const policy = argv.policy as string;
  const result = await getRecordingPolicy(token, policy);
  if (tryHandleMcpError(result)) return;

  let data: PolicyDetail;
  try {
    data = parseToolJson<PolicyDetail>(result);
  } catch {
    message(extractText(result));
    return;
  }

  const flags = extractFlags(argv);
  const format = resolveFormat(flags);

  if (format === 'json') {
    message(
      formatJson({
        name: data.name,
        displayName: data.displayName || '',
        clients: data.clients ?? [],
        rules: data.rules ?? [],
      }),
    );
    return;
  }

  print({
    data: {
      Name: data.name,
      'Display Name': data.displayName || '(unnamed)',
      Clients: (data.clients ?? []).join(', '),
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
});
