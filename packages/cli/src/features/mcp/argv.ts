import { resolve } from 'node:path';

export function resolveFlag(name: string, argv: Record<string, unknown>): string | undefined {
  return argv[name] as string | undefined;
}

export function resolveProjectDir(argv: Record<string, unknown>): string {
  const dir = resolveFlag('dir', argv);
  return dir ? resolve(dir) : process.cwd();
}
