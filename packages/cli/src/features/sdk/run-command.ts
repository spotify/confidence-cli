import { execFile } from '@spotify-confidence/core';

type RunResult = { ok: true } | { ok: false; error: string } | { ok: false; aborted: true };

export async function runCommand(command: string, projectDir: string): Promise<RunResult> {
  const [cmd, ...args] = command.split(/\s+/);

  const ac = new AbortController();
  const onSignal = () => ac.abort();
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  try {
    await execFile(cmd, args, { cwd: projectDir, signal: ac.signal });
    return { ok: true };
  } catch (err) {
    return ac.signal.aborted
      ? { ok: false, aborted: true }
      : { ok: false, error: (err as Error).message };
  } finally {
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
  }
}
