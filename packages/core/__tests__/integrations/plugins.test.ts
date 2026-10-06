import { installPlugin, uninstallPlugin, updatePlugin } from '@integrations/skills/plugin.js';
import type { IdeIntegration } from '@integrations/types.js';

vi.mock('../../src/integrations/skills/local.js', () => ({
  downloadSkills: vi.fn().mockResolvedValue(undefined),
  removeSkills: vi.fn().mockResolvedValue(undefined),
  hasDownloadedSkills: vi.fn().mockReturnValue(false),
}));

const mockIntegration: IdeIntegration = {
  id: 'claude',
  name: 'Claude Code',
  launchChat: vi.fn(),
  runOnboarding: vi.fn().mockReturnValue(null),
  prepare: vi.fn().mockResolvedValue(undefined),
  skillsDir: vi.fn().mockReturnValue('/project/.claude/skills'),
  detectPlugin: vi.fn().mockResolvedValue(null),
  installPlugin: vi.fn().mockResolvedValue(undefined),
  updatePlugin: vi.fn().mockResolvedValue(undefined),
  uninstallPlugin: vi.fn().mockResolvedValue(undefined),
  detectMcpStatuses: vi.fn().mockResolvedValue({}),
  connectMcpServer: vi.fn().mockResolvedValue(undefined),
  disconnectMcpServer: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../src/integrations/registry.js', () => ({
  getIntegration: () => mockIntegration,
  getIntegrations: () => [mockIntegration],
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('installPlugin', () => {
  it('returns cli when IDE install succeeds', async () => {
    const sut = await installPlugin('claude', '/project');

    expect(sut).toBe('cli');
    expect(mockIntegration.installPlugin).toHaveBeenCalledWith('/project', undefined);
  });

  it('falls back to download on any error', async () => {
    const { downloadSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.installPlugin).mockRejectedValueOnce(new Error('network error'));

    const sut = await installPlugin('claude', '/project');

    expect(sut).toBe('download');
    expect(downloadSkills).toHaveBeenCalledWith('/project/.claude/skills');
  });
});

describe('uninstallPlugin', () => {
  it('calls CLI uninstall and removes skills when installed via cli', async () => {
    const { removeSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.detectPlugin).mockResolvedValueOnce('cli');

    await uninstallPlugin('claude', '/project');

    expect(mockIntegration.uninstallPlugin).toHaveBeenCalledWith('/project', undefined);
    expect(removeSkills).toHaveBeenCalledWith('/project/.claude/skills');
  });

  it('only removes downloaded skills when installed via download', async () => {
    const { removeSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.detectPlugin).mockResolvedValueOnce('download');

    await uninstallPlugin('claude', '/project');

    expect(mockIntegration.uninstallPlugin).not.toHaveBeenCalled();
    expect(removeSkills).toHaveBeenCalledWith('/project/.claude/skills');
  });

  it('only removes downloaded skills when no plugin detected', async () => {
    const { removeSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.detectPlugin).mockResolvedValueOnce(null);

    await uninstallPlugin('claude', '/project');

    expect(mockIntegration.uninstallPlugin).not.toHaveBeenCalled();
    expect(removeSkills).toHaveBeenCalledWith('/project/.claude/skills');
  });

  it('does not remove local skills when scope is not project', async () => {
    const { removeSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.detectPlugin).mockResolvedValueOnce('cli');

    await uninstallPlugin('claude', '/project', 'global');

    expect(mockIntegration.uninstallPlugin).toHaveBeenCalledWith('/project', 'global');
    expect(removeSkills).not.toHaveBeenCalled();
  });
});

describe('updatePlugin', () => {
  it('returns cli when IDE update succeeds', async () => {
    const sut = await updatePlugin('claude', '/project');

    expect(sut).toBe('cli');
    expect(mockIntegration.updatePlugin).toHaveBeenCalledWith('/project', undefined);
  });

  it('falls back to download on any error', async () => {
    const { downloadSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.updatePlugin).mockRejectedValueOnce(new Error('network error'));

    const sut = await updatePlugin('claude', '/project');

    expect(sut).toBe('download');
    expect(downloadSkills).toHaveBeenCalledWith('/project/.claude/skills', true);
  });
});
