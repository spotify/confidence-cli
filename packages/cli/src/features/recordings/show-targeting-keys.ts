import { extractText, parseToolJson } from '@spotify-confidence/core';
import { getContextSchema } from '@network/recordings.js';
import { message, fail, print, extractFlags } from '@output/print.js';
import { requireAuth } from '../../utils/require-auth.js';
import { handleMcpError } from './format-mcp-error.js';

type ContextField = {
  name: string;
  type: string;
  isEntity: boolean;
};

type SchemaResponse = {
  fields: ContextField[];
};

export async function showTargetingKeys(argv: Record<string, unknown>): Promise<void> {
  const token = requireAuth(argv.profile as string | undefined);
  if (!token) return;

  const client = argv.client as string;

  try {
    const result = await getContextSchema(token, client);
    if (handleMcpError(result)) return;

    let data: SchemaResponse;
    try {
      data = parseToolJson<SchemaResponse>(result);
    } catch {
      message(extractText(result));
      return;
    }

    print({
      data: data.fields.map((f) => ({
        name: f.name,
        type: f.type,
        entity: f.isEntity ? 'yes' : 'no',
      })),
      columns: [
        { key: 'name', header: 'Field Name' },
        { key: 'type', header: 'Type', width: 10 },
        { key: 'entity', header: 'Entity', width: 6 },
      ],
      flags: extractFlags(argv),
      empty: 'No context fields found.',
    });
  } catch (err) {
    fail((err as Error).message);
  }
}
