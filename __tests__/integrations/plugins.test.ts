import { installPlugin } from '@integrations/skills/plugin.js';
import type { IdeIntegration } from '@integrations/types.js';

vi.mock('../../src/integrations/skills/local.js', () => ({
  downloadSkills: vi.fn().mockResolvedValue(undefined),
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
  detectMcpStatuses: vi.fn().mockResolvedValue({}),
  connectMcpServer: vi.fn().mockResolvedValue(undefined),
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
    expect(mockIntegration.installPlugin).toHaveBeenCalledWith('/project');
  });

  it('falls back to download when CLI install throws', async () => {
    const { downloadSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.installPlugin).mockRejectedValueOnce(new Error('not supported'));

    const sut = await installPlugin('claude', '/project');

    expect(sut).toBe('download');
    expect(mockIntegration.installPlugin).toHaveBeenCalledWith('/project');
    expect(downloadSkills).toHaveBeenCalledWith('/project/.claude/skills');
  });
});
