import { setConfigValue } from '@spotify-confidence/core';
import { prepareAuthTokens } from '@spotify-confidence/testing/auth';

vi.mock('@inquirer/select', () => ({
  default: vi.fn(),
}));

import select from '@inquirer/select';

describe('resolveIde', () => {
  async function loadResolveIde() {
    const mod = await import('@features/mcp/resolve-ide.js');
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

  it('prompts when no IDE is saved and returns the selection', async () => {
    using _config = prepareAuthTokens('none');
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
    vi.mocked(select).mockResolvedValueOnce('claude');
    const sut = await loadResolveIde();

    await sut();

    const { getConfigValue } = await import('@spotify-confidence/core');
    expect(getConfigValue('ide')).toBe('claude');
  });
});
