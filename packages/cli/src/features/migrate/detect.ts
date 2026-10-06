import { detectProviders } from '@spotify-confidence/core';
import { print, message, extractFlags } from '@output/print.js';
import { resolveProjectDir } from '@features/mcp/index.js';

export async function detectAndPrint(argv: Record<string, unknown>): Promise<void> {
  const projectDir = resolveProjectDir(argv);
  const providers = detectProviders(projectDir);

  if (providers.length === 0) {
    message('No third-party providers detected.');
    return;
  }

  print({
    data: providers.map((p) => ({
      provider: p.name,
      id: p.id,
      command: `confidence migrate ${p.id}`,
    })),
    columns: [
      { key: 'provider', header: 'Provider', width: 15 },
      { key: 'id', header: 'ID', width: 15 },
      { key: 'command', header: 'Command' },
    ],
    flags: extractFlags(argv),
  });
}
