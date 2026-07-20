import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { spawn } from 'node:child_process';

export function createFakeChild(
  opts: {
    lines?: string[];
    exitCode?: number;
    error?: Error;
    stderrOutput?: string;
    emitDelay?: number;
    hang?: boolean;
  } = {},
) {
  const { lines = [], exitCode = 0, error, stderrOutput, emitDelay = 50, hang = false } = opts;
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const child = Object.assign(new EventEmitter(), {
    stdout,
    stderr,
    stdin: null,
    pid: 1234,
    kill: vi.fn(),
  });

  setTimeout(() => {
    if (error) {
      child.emit('error', error);
      return;
    }
    if (stderrOutput) stderr.write(stderrOutput);
    for (const line of lines) stdout.write(line + '\n');
    if (!hang) {
      stdout.on('end', () => child.emit('close', exitCode));
      stdout.end();
    }
  }, emitDelay);

  return child;
}

export function mockNextSpawn(opts?: Parameters<typeof createFakeChild>[0]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(spawn).mockImplementationOnce((() => createFakeChild(opts)) as any);
}
