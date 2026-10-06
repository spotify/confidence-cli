import { setConfigValue } from '@spotify-confidence/core';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';
import { simulateTTY } from '../../helpers/simulate-tty.js';

vi.mock('@inquirer/select', () => ({
  default: vi.fn(),
}));

import select from '@inquirer/select';

describe('resolveIde', () => {
  async function loadResolveIde() {
    const mod = await import('@features/ide/resolve-ide.js');
    return mod.resolveIde;
  }

  it('returns the saved IDE from config without prompting', async () => {
    using _config = prepareAuthTokens('none');
    setConfigValue('ide', 'cursor');
    const sut = await loadResolveIde();

    const result = await sut();

    expect(result).toBe('cursor');
    expect(select).not.toHaveBeenCalled();
  });

  it('prompts when no IDE is saved and stdin is a TTY', async () => {
    using _config = prepareAuthTokens('none');
    using _tty = simulateTTY(true);
    vi.mocked(select).mockResolvedValueOnce('codex');
    const sut = await loadResolveIde();

    const result = await sut();

    expect(result).toBe('codex');
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('AI coding agent'),
      }),
    );
  });

  it('persists the selected IDE to config', async () => {
    using _config = prepareAuthTokens('none');
    using _tty = simulateTTY(true);
    vi.mocked(select).mockResolvedValueOnce('claude');
    const sut = await loadResolveIde();

    await sut();

    const { getConfigValue } = await import('@spotify-confidence/core');
    expect(getConfigValue('ide')).toBe('claude');
  });

  it('returns the explicit IDE without prompting or reading config', async () => {
    using _config = prepareAuthTokens('none');
    const sut = await loadResolveIde();

    const result = await sut('codex');

    expect(result).toBe('codex');
    expect(select).not.toHaveBeenCalled();
  });

  it('rejects an unknown explicit IDE', async () => {
    const sut = await loadResolveIde();

    await expect(sut('vim')).rejects.toThrow('Unsupported IDE "vim"');
  });

  it('throws when non-interactive and no IDE is configured', async () => {
    using _config = prepareAuthTokens('none');
    using _tty = simulateTTY(false);
    const sut = await loadResolveIde();

    await expect(sut()).rejects.toThrow('No IDE configured');
  });
});
