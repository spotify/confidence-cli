import { vi } from 'vitest';

const execFile = vi.fn();

vi.mock('node:child_process', () => ({
  execFile: (
    _cmd: string,
    _args: string[],
    cb: (err: Error | null, stdout?: string, stderr?: string) => void,
  ) => {
    const result = execFile(_cmd, _args) as Promise<{ stdout: string }>;
    result.then(
      (val) => cb(null, val.stdout, ''),
      (err: Error) => cb(err),
    );
    return {};
  },
}));

vi.mock('node:util', () => ({
  promisify: () => (cmd: string, args: string[]) =>
    execFile(cmd, args) as Promise<{ stdout: string }>,
}));

beforeEach(() => {
  execFile.mockReset();
});

describe('claude prepare', () => {
  async function loadPrepare() {
    const mod = await import('@integrations/claude/prepare.js');
    return mod.prepare;
  }

  it('throws when CLI is not found', async () => {
    const sut = await loadPrepare();
    execFile.mockRejectedValueOnce(new Error('ENOENT'));

    await expect(sut()).rejects.toThrow('Claude Code CLI not found');
  });

  it('throws when version is below minimum', async () => {
    const sut = await loadPrepare();
    execFile.mockResolvedValueOnce({ stdout: '1.0.0 (Claude Code)' });

    await expect(sut()).rejects.toThrow('or later is required');
  });

  it('succeeds when version meets minimum', async () => {
    const sut = await loadPrepare();
    execFile.mockResolvedValueOnce({ stdout: '2.1.212 (Claude Code)' });

    await expect(sut()).resolves.toBeUndefined();
  });

  it('succeeds when version exceeds minimum', async () => {
    const sut = await loadPrepare();
    execFile.mockResolvedValueOnce({ stdout: '3.0.0 (Claude Code)' });

    await expect(sut()).resolves.toBeUndefined();
  });
});

describe('cursor prepare', () => {
  async function loadPrepare() {
    const mod = await import('@integrations/cursor/prepare.js');
    return mod.prepare;
  }

  it('throws when CLI is not found', async () => {
    const sut = await loadPrepare();
    execFile.mockRejectedValueOnce(new Error('ENOENT'));

    await expect(sut()).rejects.toThrow('Cursor CLI not found');
  });

  it('throws when version is below minimum', async () => {
    const sut = await loadPrepare();
    execFile.mockResolvedValueOnce({ stdout: '2.0.0' });

    await expect(sut()).rejects.toThrow('or later is required');
  });

  it('succeeds and checks agent status when version meets minimum', async () => {
    const sut = await loadPrepare();
    execFile.mockResolvedValueOnce({ stdout: '3.19.7' });
    execFile.mockResolvedValueOnce({ stdout: 'logged in' });

    await expect(sut()).resolves.toBeUndefined();
    expect(execFile).toHaveBeenCalledWith('cursor', ['agent', 'status']);
  });

  it('falls back to agent login when status check fails', async () => {
    const sut = await loadPrepare();
    execFile.mockResolvedValueOnce({ stdout: '3.19.7' });
    execFile.mockRejectedValueOnce(new Error('not logged in'));
    execFile.mockResolvedValueOnce({ stdout: '' });

    await expect(sut()).resolves.toBeUndefined();
    expect(execFile).toHaveBeenCalledWith('cursor', ['agent', 'login']);
  });
});

describe('codex prepare', () => {
  async function loadPrepare() {
    const mod = await import('@integrations/codex/prepare.js');
    return mod.prepare;
  }

  it('throws when CLI is not found', async () => {
    const sut = await loadPrepare();
    execFile.mockRejectedValueOnce(new Error('ENOENT'));

    await expect(sut()).rejects.toThrow('Codex CLI not found');
  });

  it('throws when version is below minimum', async () => {
    const sut = await loadPrepare();
    execFile.mockResolvedValueOnce({ stdout: 'codex-cli 0.100.0' });

    await expect(sut()).rejects.toThrow('or later is required');
  });

  it('throws when not logged in', async () => {
    const sut = await loadPrepare();
    execFile.mockResolvedValueOnce({ stdout: 'codex-cli 0.146.0' });
    execFile.mockRejectedValueOnce(new Error('not logged in'));

    await expect(sut()).rejects.toThrow('Not logged in to Codex');
  });

  it('succeeds when version meets minimum and logged in', async () => {
    const sut = await loadPrepare();
    execFile.mockResolvedValueOnce({ stdout: 'codex-cli 0.146.0' });
    execFile.mockResolvedValueOnce({ stdout: 'logged in' });

    await expect(sut()).resolves.toBeUndefined();
  });
});
