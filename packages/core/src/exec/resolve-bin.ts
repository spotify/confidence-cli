import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';

type ResolveBinOptions = {
  /** Override `process.platform` (tests). @defaultValue `process.platform` */
  platform?: NodeJS.Platform;
  /** PATH to search for a `.js` shim. @defaultValue `process.env.PATH` */
  pathEnv?: string;
  /** Node executable used to run a `.js` shim. @defaultValue `process.execPath` */
  execPath?: string;
  /** Override filesystem lookup (tests). @defaultValue `existsSync` */
  exists?: (path: string) => boolean;
};

export type ResolvedBin = {
  command: string;
  args: string[];
};

/**
 * Resolves a command so `execFile`/`spawn` can run it without a shell.
 *
 * On Windows, `CreateProcess` cannot execute `.cmd` shims. If `{command}.js`
 * exists on PATH (the e2e mock layout), run it with Node instead so flags
 * like `--version` are passed to the script rather than to Node itself.
 * For `.cmd` wrappers installed by npm, `cross-spawn` handles resolution.
 */
export function resolveBin(
  command: string,
  args: readonly string[],
  options: ResolveBinOptions = {},
): ResolvedBin {
  const platform = options.platform ?? process.platform;
  if (platform !== 'win32') {
    return { command, args: [...args] };
  }

  const pathEnv = options.pathEnv ?? process.env.PATH ?? process.env.Path ?? '';
  const exists = options.exists ?? existsSync;
  const execPath = options.execPath ?? process.execPath;

  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) continue;
    const jsPath = join(dir, `${command}.js`);

    if (exists(jsPath)) {
      return { command: execPath, args: [jsPath, ...args] };
    }
  }

  return { command, args: [...args] };
}

export function pathFromEnv(env?: NodeJS.ProcessEnv): string | undefined {
  if (!env) return undefined;
  return env.PATH ?? env.Path ?? env.path;
}
