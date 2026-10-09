import { installPlugin, uninstallPlugin, updatePlugin } from '@integrations/skills/plugin.js';
import { createMockIntegration } from './mock-integration.js';

vi.mock('../../src/telemetry/telemetry.js', () => ({
  track: vi.fn(),
}));

vi.mock('../../src/integrations/skills/local.js', () => ({
  downloadSkills: vi.fn().mockResolvedValue(true),
  removeSkills: vi.fn().mockResolvedValue(undefined),
  hasSkills: vi.fn().mockReturnValue(false),
  getSkillsDir: vi.fn().mockReturnValue('/mock-home/.config/confidence/skills'),
}));

const mockIntegration = createMockIntegration();

vi.mock('../../src/integrations/registry.js', () => ({
  getIntegration: () => mockIntegration,
  getIntegrations: () => [mockIntegration],
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('installPlugin', () => {
  it('attempts CLI install and downloads skills', async () => {
    await installPlugin('claude', '/project');

    expect(mockIntegration.installPlugin).toHaveBeenCalledWith('/project', undefined);
  });

  it('always downloads skills to the shared directory', async () => {
    const { downloadSkills } = await import('../../src/integrations/skills/local.js');

    await installPlugin('claude', '/project');

    expect(downloadSkills).toHaveBeenCalledWith('/mock-home/.config/confidence/skills');
  });

  it('succeeds via download when CLI install fails', async () => {
    const { downloadSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.installPlugin).mockRejectedValueOnce(new Error('network error'));

    await installPlugin('claude', '/project');

    expect(downloadSkills).toHaveBeenCalledWith('/mock-home/.config/confidence/skills');
  });

  it('throws when both CLI install and download fail', async () => {
    const { downloadSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.installPlugin).mockRejectedValueOnce(new Error('cli failed'));
    vi.mocked(downloadSkills).mockResolvedValueOnce(false);

    await expect(installPlugin('claude', '/project')).rejects.toThrow('cli failed');
  });
});

describe('uninstallPlugin', () => {
  it('calls CLI uninstall and removes skills when no other IDE has plugin', async () => {
    const { removeSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.detectPlugin).mockResolvedValueOnce(true);
    vi.mocked(mockIntegration.detectPlugin).mockResolvedValueOnce(false);

    await uninstallPlugin('claude', '/project');

    expect(mockIntegration.uninstallPlugin).toHaveBeenCalledWith('/project', undefined);
    expect(removeSkills).toHaveBeenCalledWith('/mock-home/.config/confidence/skills');
  });

  it('preserves skills when another IDE still has the plugin', async () => {
    const { removeSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.detectPlugin).mockResolvedValueOnce(true);
    vi.mocked(mockIntegration.detectPlugin).mockResolvedValueOnce(true);

    await uninstallPlugin('claude', '/project');

    expect(mockIntegration.uninstallPlugin).toHaveBeenCalled();
    expect(removeSkills).not.toHaveBeenCalled();
  });

  it('removes skills when CLI plugin is not detected and no other IDE has it', async () => {
    const { removeSkills } = await import('../../src/integrations/skills/local.js');

    await uninstallPlugin('claude', '/project');

    expect(mockIntegration.uninstallPlugin).not.toHaveBeenCalled();
    expect(removeSkills).toHaveBeenCalledWith('/mock-home/.config/confidence/skills');
  });
});

describe('updatePlugin', () => {
  it('attempts CLI update and force-downloads skills', async () => {
    const { downloadSkills } = await import('../../src/integrations/skills/local.js');

    await updatePlugin('claude', '/project');

    expect(mockIntegration.updatePlugin).toHaveBeenCalledWith('/project', undefined);
    expect(downloadSkills).toHaveBeenCalledWith('/mock-home/.config/confidence/skills', true);
  });

  it('succeeds via download when CLI update fails', async () => {
    const { downloadSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.updatePlugin).mockRejectedValueOnce(new Error('network error'));

    await updatePlugin('claude', '/project');

    expect(downloadSkills).toHaveBeenCalledWith('/mock-home/.config/confidence/skills', true);
  });

  it('throws when both CLI update and download fail', async () => {
    const { downloadSkills } = await import('../../src/integrations/skills/local.js');
    vi.mocked(mockIntegration.updatePlugin).mockRejectedValueOnce(new Error('cli failed'));
    vi.mocked(downloadSkills).mockResolvedValueOnce(false);

    await expect(updatePlugin('claude', '/project')).rejects.toThrow('cli failed');
  });
});
