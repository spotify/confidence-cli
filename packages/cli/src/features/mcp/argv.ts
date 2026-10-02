import { resolve } from 'node:path';

export function resolveProjectDir(argv: Record<string, unknown>): string {
  const dir = argv.dir as string | undefined;
  return dir ? resolve(dir) : process.cwd();
}

export function resolveProfile(argv: Record<string, unknown>): string | undefined {
  return argv.profile as string | undefined;
}
