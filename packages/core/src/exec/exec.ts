import {
  execFile as cpExecFile,
  spawn as cpSpawn,
  type ChildProcess,
  type ExecFileOptions,
  type SpawnOptions,
} from 'node:child_process';
import { promisify } from 'node:util';
import { pathFromEnv, resolveBin } from './resolve-bin.js';

const promisifiedExecFile = promisify(cpExecFile);

/**
 * `spawn` that resolves Windows `.js` and `.cmd` PATH shims.
 *
 * @see {@link resolveBin}
 */
export function spawn(
  command: string,
  args: readonly string[],
  options?: SpawnOptions,
): ChildProcess {
  const resolved = resolveBin(command, args, { pathEnv: pathFromEnv(options?.env) });
  return cpSpawn(resolved.command, resolved.args, { ...options, shell: resolved.shell });
}

/**
 * `execFile` that resolves Windows `.js` and `.cmd` PATH shims.
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
    shell: resolved.shell,
  });
  return { stdout, stderr };
}
