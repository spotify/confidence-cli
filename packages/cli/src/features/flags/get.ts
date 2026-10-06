import { getFlag } from '@network/index.js';
import { resolveFormat, formatJson, extractFlags, fail, message, print } from '@output/index.js';
import { withAuth } from '@utils/index.js';
import { flagStatus } from './status.js';

export const getFlagCmd = withAuth(async function getFlagCmd(argv, token) {
  const flagKey = argv['flag-key'] as string;

  const result = await getFlag(token, flagKey);

  if (!result.ok) {
    fail(result.error.message);
    return;
  }

  const flag = result.data;
  const flags = extractFlags(argv);
  const format = resolveFormat(flags);

  if (format === 'json') {
    message(formatJson(flag));
    return;
  }

  print({
    data: {
      'Flag Key': flag.flagId ?? flag.name.replace(/^flags\//, ''),
      Description: flag.description ?? '',
      Status: flagStatus(flag),
      Created: flag.createTime ?? '',
      Updated: flag.updateTime ?? '',
    },
    columns: [
      { key: 'key', header: 'Field', width: 14 },
      { key: 'value', header: 'Value' },
    ],
    flags,
  });

  if (flag.variants && flag.variants.length > 0) {
    message('');
    message('Variants:');
    print({
      data: flag.variants.map((v) => ({
        name: v.name.split('/').pop() ?? v.name,
        description: v.description ?? '',
      })),
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'description', header: 'Description' },
      ],
      flags,
    });
  }

  if (flag.rules && flag.rules.length > 0) {
    message('');
    message('Targeting Rules:');
    print({
      data: flag.rules.map((r) => ({
        name: r.name.split('/').pop() ?? r.name,
        enabled: String(r.enabled ?? false),
        targetingKey: r.targetingKeySelector ?? '',
      })),
      columns: [
        { key: 'name', header: 'Rule' },
        { key: 'enabled', header: 'Enabled' },
        { key: 'targetingKey', header: 'Targeting Key' },
      ],
      flags,
    });
  }
});
