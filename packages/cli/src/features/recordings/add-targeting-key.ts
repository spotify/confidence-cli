import { addContextField } from '@network/recordings.js';
import { fail, printMcpResult } from '@output/print.js';
import { requireAuth } from '../../utils/require-auth.js';
import { readJsonFile } from '../../utils/read-json-file.js';

type FieldParams = {
  'field-name': string;
  'field-type': string;
  'is-entity'?: boolean;
};

export async function addTargetingKey(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  let params: FieldParams;
  try {
    const fromFile = argv['from-file'] as string | undefined;
    if (fromFile) {
      params = readJsonFile<FieldParams>(fromFile);
    } else {
      params = {
        'field-name': argv['field-name'] as string,
        'field-type': argv['field-type'] as string,
        'is-entity': argv['is-entity'] as boolean | undefined,
      };
    }
  } catch (err) {
    fail((err as Error).message);
    return;
  }

  try {
    const result = await addContextField(token, {
      fieldName: params['field-name'],
      fieldType: params['field-type'],
      isEntity: params['is-entity'] ?? true,
    });
    printMcpResult(result, argv);
  } catch (err) {
    fail((err as Error).message);
  }
}
