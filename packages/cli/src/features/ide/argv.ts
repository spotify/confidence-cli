import { resolve } from 'node:path';
import type { IdeId, PluginScope } from '@spotify-confidence/shared-kernel';

export function resolveFlag(name: string, argv: Record<string, unknown>): string | undefined {
  return argv[name] as string | undefined;
}

export function resolveProjectDir(argv: Record<string, unknown>): string {
  const dir = resolveFlag('dir', argv);
  return dir ? resolve(dir) : process.cwd();
}

export function resolveScope(argv: Record<string, unknown>): PluginScope {
  return (resolveFlag('scope', argv) as PluginScope) ?? 'project';
}

export function requireClaudeForScope(ideId: IdeId, scope: PluginScope): void {
  if (scope !== 'project' && ideId !== 'claude') {
    throw new Error(`--scope is only supported for Claude Code (got ${ideId}).`);
  }
}
