import type { IdeIntegration } from '@spotify-confidence/core';

export function createMockIntegration(overrides?: Partial<IdeIntegration>): IdeIntegration {
  return {
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
    ...overrides,
  };
}
