import { execFile as cpExecFile, type ExecFileOptions } from 'node:child_process';
import type { ChildProcess, SpawnOptions } from 'node:child_process';
import { promisify } from 'node:util';

import crossSpawn from 'cross-spawn';

import { pathFromEnv, resolveBin } from './resolve-bin.js';

const promisifiedExecFile = promisify(cpExecFile);

/**
 * `spawn` that resolves Windows `.js` PATH shims via `cross-spawn`.
 *
 * @see {@link resolveBin}
 */
export function spawn(
  command: string,
  args: readonly string[],
  options?: SpawnOptions,
): ChildProcess {
  const resolved = resolveBin(command, args, { pathEnv: pathFromEnv(options?.env) });
  return crossSpawn(resolved.command, resolved.args, options ?? {});
}

/**
 * `execFile` that resolves Windows `.js` PATH shims via `cross-spawn`.
 *
 * @see {@link resolveBin}
 */
export async function execFile(
  command: string,
  args: readonly string[],
  options?: ExecFileOptions,
): Promise<{ stdout: string; stderr: string }> {
  const resolved = resolveBin(command, args, { pathEnv: pathFromEnv(options?.env) });
  const { stdout, stderr } = await promisifiedExecFile(resolved.command, resolved.args, {
    ...options,
    encoding: 'utf8',
  });
  return { stdout, stderr };
}
