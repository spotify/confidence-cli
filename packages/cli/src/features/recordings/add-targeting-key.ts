import { addContextField } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withCrossCutting } from '@composition';
import { dryRunGuard } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { requireKeys } from '@utils/validation.js';
import { tryHandleMcpError } from './format-mcp-error.js';

type FieldParams = {
  'field-name': string;
  'field-type': string;
  'display-name': string | undefined;
  'is-entity': boolean;
  'entity-reference': string | undefined;
  client: string[];
};

export const addTargetingKey = withCrossCutting(async function addTargetingKey(argv, token) {
  const params = resolveInput<FieldParams>(argv, [
    'field-name',
    'field-type',
    'display-name',
    'is-entity',
    'entity-reference',
    'client',
  ]);

  requireKeys(params, ['field-name', 'field-type']);

  const payload = {
    fieldName: params['field-name'],
    fieldType: params['field-type'],
    displayName: params['display-name'],
    isEntity: params['is-entity'],
    entityReference: params['entity-reference'],
    clients: params.client,
  };
  if (dryRunGuard(argv, payload)) return;

  const result = await addContextField(token, payload);
  if (tryHandleMcpError(result)) return;
  printMcpResult(result, argv);
});
