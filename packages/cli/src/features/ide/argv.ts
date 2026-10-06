import { resolve } from 'node:path';
import type { IdeId, PluginScope } from '@spotify-confidence/shared-kernel';

const VALID_SCOPES = new Set<PluginScope>(['project', 'local', 'global']);
const VALID_SCOPE_LIST = [...VALID_SCOPES].join(', ');

export function resolveFlag(name: string, argv: Record<string, unknown>): string | undefined {
  return argv[name] as string | undefined;
}

export function resolveProjectDir(argv: Record<string, unknown>): string {
  const dir = resolveFlag('dir', argv);
  return dir ? resolve(dir) : process.cwd();
}

export function resolveScope(argv: Record<string, unknown>): PluginScope {
  const value = resolveFlag('scope', argv) ?? 'project';
  if (!VALID_SCOPES.has(value as PluginScope)) {
    throw new Error(`Unsupported scope "${value}". Valid options: ${VALID_SCOPE_LIST}`);
  }
  return value as PluginScope;
}

export function requireClaudeForScope(ideId: IdeId, scope: PluginScope): void {
  if (scope !== 'project' && ideId !== 'claude') {
    throw new Error(
      `--scope is only supported for Claude Code. ${ideId} always uses project scope.`,
    );
  }
}
