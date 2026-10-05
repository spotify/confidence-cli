import { readFileSync } from 'node:fs';
import { createEventDefinition } from '@api/events.js';
import type { EventField, EventFieldType, CreateEventRequest } from '@api/types.js';
import { print, message, fail, extractFlags } from '@output/print.js';
import { requireAuth } from './require-auth.js';
import { formatApiError } from './format-error.js';

const VALID_FIELD_TYPES = new Set<string>(['STRING', 'NUMBER', 'BOOLEAN', 'STRUCT']);

export function parseFieldSpec(spec: string): EventField {
  const colonIndex = spec.indexOf(':');
  if (colonIndex === -1) {
    throw new Error(`Invalid field format "${spec}". Expected "name:TYPE" (e.g. "page:STRING").`);
  }

  const name = spec.slice(0, colonIndex).trim();
  const type = spec
    .slice(colonIndex + 1)
    .trim()
    .toUpperCase();

  if (!name) {
    throw new Error(`Invalid field format "${spec}". Field name cannot be empty.`);
  }

  if (!VALID_FIELD_TYPES.has(type)) {
    throw new Error(
      `Invalid field type "${type}" in "${spec}". Must be one of: STRING, NUMBER, BOOLEAN, STRUCT.`,
    );
  }

  return { name, type: type as EventFieldType };
}

function readDefinitionFromFile(filePath: string): CreateEventRequest {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Could not read file "${filePath}": ${(err as Error).message}`, { cause: err });
  }

  try {
    return JSON.parse(content) as CreateEventRequest;
  } catch (err) {
    throw new Error(`Invalid JSON in "${filePath}".`, { cause: err });
  }
}

export async function createEvent(argv: Record<string, unknown>): Promise<void> {
  const auth = requireAuth(argv.profile as string | undefined);
  if (!auth) return;

  let body: CreateEventRequest;

  try {
    const fromFile = argv['from-file'] as string | undefined;
    if (fromFile) {
      body = readDefinitionFromFile(fromFile);
    } else {
      const displayName = argv.name as string;
      const description = argv.description as string | undefined;
      const fieldSpecs = (argv.field as string[] | undefined) ?? [];
      const fields = fieldSpecs.map(parseFieldSpec);
      body = { displayName, description, fields };
    }
  } catch (err) {
    fail((err as Error).message);
    return;
  }

  if (argv['dry-run']) {
    message(JSON.stringify(body, null, 2));
    return;
  }

  const result = await createEventDefinition(auth.token, auth.region, body);

  if (!result.ok) {
    fail(formatApiError(result));
    return;
  }

  const event = result.data;
  print({
    data: {
      name: event.name,
      displayName: event.displayName,
      description: event.description ?? '',
      fields: String(event.fields.length),
      created: event.createTime ?? '',
    },
    columns: [
      { key: 'key', header: 'Field', width: 14 },
      { key: 'value', header: 'Value' },
    ],
    flags: extractFlags(argv),
  });
}
