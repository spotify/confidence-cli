import { addContextField } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '../../utils/require-auth.js';
import { resolveTargetFile } from '../../utils/read-json-file.js';
import { requireKeys } from '../../utils/validation.js';
import { tryHandleMcpError } from './format-mcp-error.js';

type FieldParams = {
  'field-name': string;
  'field-type': string;
  'display-name': string | undefined;
  'is-entity': boolean;
  'entity-reference': string | undefined;
  client: string[];
};

export const addTargetingKey = withAuth(async function addTargetingKey(argv, token) {
  const params = resolveTargetFile<FieldParams>(
    argv,
    () => ({
      'field-name': argv['field-name'] as string,
      'field-type': argv['field-type'] as string,
      'display-name': argv['display-name'] as string | undefined,
      'is-entity': argv['is-entity'] as boolean,
      'entity-reference': argv['entity-reference'] as string | undefined,
      client: (argv.client as string[]) ?? [],
    }),
    { merge: true },
  );

  requireKeys(params, ['field-name', 'field-type']);

  const result = await addContextField(token, {
    fieldName: params['field-name'],
    fieldType: params['field-type'],
    displayName: params['display-name'],
    isEntity: params['is-entity'],
    entityReference: params['entity-reference'],
    clients: params.client,
  });
  if (tryHandleMcpError(result)) return;
  printMcpResult(result, argv);
});
