import { addContextField } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '../../utils/require-auth.js';
import { resolveTargetFile } from '../../utils/read-json-file.js';
import { requireKeys } from '../../utils/validation.js';

type FieldParams = {
  'field-name': string;
  'field-type': string;
  'is-entity': boolean;
};

export const addTargetingKey = withAuth(async function addTargetingKey(argv, token) {
  const params = resolveTargetFile<FieldParams>(
    argv,
    () => ({
      'field-name': argv['field-name'] as string,
      'field-type': argv['field-type'] as string,
      'is-entity': argv['is-entity'] as boolean,
    }),
    { merge: true },
  );

  requireKeys(params, ['field-name', 'field-type']);

  const result = await addContextField(token, {
    fieldName: params['field-name'],
    fieldType: params['field-type'],
    isEntity: params['is-entity'],
  });
  printMcpResult(result, argv);
});
