import type { JsonObject } from '@spotify-confidence/shared-kernel';
import { getFlag, updateFlag } from '@network/index.js';
import { extractFlags, fail, message, print } from '@output/index.js';
import { withAuth } from '@utils/require-auth.js';
import { flagStatus } from './status.js';
import { resolveInput } from '@input/index.js';

export const updateFlagCmd = withAuth(async function updateFlagCmd(argv, token) {
  const flagKey = argv['flag-key'] as string;

  const opts = resolveInput(argv, ['description', 'add-variant']);
  const description = opts.description as string | undefined;
  const addVariants = opts['add-variant'] as string[] | undefined;

  const body: JsonObject = {};
  if (description !== undefined) body.description = description;
  if (addVariants && addVariants.length > 0) {
    const existing = await getFlag(token, flagKey);
    if (!existing.ok) {
      fail(existing.error.message);
      return;
    }

    const existingVariants = existing.data.variants ?? [];
    const newVariants = addVariants.map((v) => ({ name: `flags/${flagKey}/variants/${v}` }));
    body.variants = [...existingVariants, ...newVariants];
  }

  if (Object.keys(body).length === 0) {
    fail('Provide at least one of --description, --add-variant, or --from-file.');
    return;
  }

  if (argv['dry-run']) {
    message(JSON.stringify({ flagKey, ...body }, null, 2));
    return;
  }

  const result = await updateFlag(token, flagKey, body);

  if (!result.ok) {
    fail(result.error.message);
    return;
  }

  const flag = result.data;

  print({
    data: {
      'Flag Key': flag.flagId ?? flag.name.replace(/^flags\//, ''),
      Description: flag.description ?? '',
      Status: flagStatus(flag),
      Updated: flag.updateTime ?? '',
    },
    columns: [
      { key: 'key', header: 'Field', width: 14 },
      { key: 'value', header: 'Value' },
    ],
    flags: extractFlags(argv),
  });
});
