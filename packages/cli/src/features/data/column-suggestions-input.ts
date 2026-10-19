import { readFileSync } from 'node:fs';
import {
  COLUMN_TYPES,
  type SuggestFactTableColumnsRequest,
} from '@network/metrics-column-suggestions.js';
import { requireRecord, requireString } from '@network/metrics-types.js';

function rejectUnknownFields(
  record: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  if (Object.keys(record).some((key) => !allowed.includes(key))) {
    throw new Error(
      `${label} accepts only ${allowed.join(', ')}; do not include rows or annotations.`,
    );
  }
}

function validateSchema(value: unknown): SuggestFactTableColumnsRequest {
  const input = requireRecord(value, 'Column suggestions input');
  rejectUnknownFields(input, ['schema'], 'Column suggestions input');
  if (!Array.isArray(input.schema) || input.schema.length === 0) {
    throw new Error('schema must be a non-empty array of columns.');
  }

  const schema = input.schema.map((value, index) => {
    const label = `schema[${index}]`;
    const column = requireRecord(value, label);
    rejectUnknownFields(column, ['name', 'type', 'repeated'], label);
    const validated: SuggestFactTableColumnsRequest['schema'][number] = {
      name: requireString(column.name, `${label}.name`),
    };
    if (Object.hasOwn(column, 'type')) {
      const type = column.type;
      if (typeof type === 'string' && COLUMN_TYPES.some((allowed) => allowed === type)) {
        validated.type = type as (typeof COLUMN_TYPES)[number];
      } else if (
        typeof type === 'number' &&
        Number.isInteger(type) &&
        type >= 0 &&
        type < COLUMN_TYPES.length
      ) {
        validated.type = type;
      } else {
        throw new Error(`${label}.type must be a ColumnType enum name or integer (0–11).`);
      }
    }
    if (Object.hasOwn(column, 'repeated')) {
      if (typeof column.repeated !== 'boolean') {
        throw new Error(`${label}.repeated must be a boolean.`);
      }
      validated.repeated = column.repeated;
    }
    return validated;
  });
  return { schema };
}

/** Only explicitly supplied schema columns may leave the machine; reject all other input. */
export function readColumnSuggestionsInput(file: unknown): SuggestFactTableColumnsRequest {
  const filePath = requireString(file, '--from-file');
  let content: string;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read schema file "${filePath}".`, { cause: err });
  }
  let input: unknown;
  try {
    input = JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid JSON in "${filePath}".`, { cause: err });
  }
  return validateSchema(input);
}
