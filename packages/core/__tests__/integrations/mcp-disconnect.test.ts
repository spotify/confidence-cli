import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createProjectDir } from '@spotify-confidence/testing/scaffold';
import {
  writeClaudeSettings,
  writeCursorMcpConfig,
  writeCursorCliConfig,
} from '@spotify-confidence/testing/scaffold';

const execFile = vi.fn().mockResolvedValue({ stdout: '' });

vi.mock('../../src/exec/exec.js', () => ({
  execFile: (cmd: string, args: string[], opts?: Record<string, unknown>) =>
    execFile(cmd, args, opts) as Promise<{ stdout: string }>,
}));

beforeEach(() => {
  execFile.mockReset().mockResolvedValue({ stdout: '' });
});

describe('claude disconnectMcpServer', () => {
  async function loadDisconnect() {
    const mod = await import('@integrations/claude/mcp.js');
    return mod.disconnectMcpServer;
  }

  it('calls claude mcp remove with the server name', async () => {
    const sut = await loadDisconnect();

    await sut({ serverName: 'confidence-flags', projectDir: '/project' });

    expect(execFile).toHaveBeenCalledWith(
      'claude',
      ['mcp', 'remove', '--scope', 'project', 'confidence-flags'],
      { cwd: '/project' },
    );
  });

  it('removes the tool permission from settings.local.json', async () => {
    using project = createProjectDir('empty');
    writeClaudeSettings(project.path, {
      permissions: { allow: ['mcp__confidence-flags__*', 'mcp__other__*'] },
      enabledMcpjsonServers: ['confidence-flags', 'other-server'],
    });
    const sut = await loadDisconnect();

    await sut({ serverName: 'confidence-flags', projectDir: project.path });

    const settings = JSON.parse(
      readFileSync(join(project.path, '.claude', 'settings.local.json'), 'utf-8'),
    );
    expect(settings.permissions.allow).toEqual(['mcp__other__*']);
    expect(settings.enabledMcpjsonServers).toEqual(['other-server']);
  });

  it('does not fail when settings.local.json does not exist', async () => {
    using project = createProjectDir('empty');
    const sut = await loadDisconnect();

    await expect(
      sut({ serverName: 'confidence-flags', projectDir: project.path }),
    ).resolves.toBeUndefined();
  });
});

describe('cursor disconnectMcpServer', () => {
  async function loadDisconnect() {
    const mod = await import('@integrations/cursor/mcp.js');
    return mod.disconnectMcpServer;
  }

  it('removes the server entry from project and global MCP configs', async () => {
    using project = createProjectDir('empty');
    writeCursorMcpConfig(project.path, {
      mcpServers: {
        'confidence-flags': { type: 'http', url: 'https://example.com' },
        'other-server': { type: 'http', url: 'https://other.com' },
      },
    });
    writeCursorCliConfig(project.path, {
      permissions: { allow: ['Mcp(confidence-flags:*)', 'Mcp(other:*)'], deny: [] },
    });

    const sut = await loadDisconnect();
    vi.stubEnv('HOME', project.path);

    await sut({ serverName: 'confidence-flags', projectDir: project.path });

    const updatedMcp = JSON.parse(
      readFileSync(join(project.path, '.cursor', 'mcp.json'), 'utf-8'),
    );
    expect(updatedMcp.mcpServers).not.toHaveProperty('confidence-flags');
    expect(updatedMcp.mcpServers).toHaveProperty('other-server');

    const updatedCli = JSON.parse(
      readFileSync(join(project.path, '.cursor', 'cli.json'), 'utf-8'),
    );
    expect(updatedCli.permissions.allow).toEqual(['Mcp(other:*)']);
  });

  it('does not fail when config files do not exist', async () => {
    using project = createProjectDir('empty');
    const sut = await loadDisconnect();

    await expect(
      sut({ serverName: 'confidence-flags', projectDir: project.path }),
    ).resolves.toBeUndefined();
  });
});

describe('codex disconnectMcpServer', () => {
  async function loadDisconnect() {
    const mod = await import('@integrations/codex/mcp.js');
    return mod.disconnectMcpServer;
  }

  it('calls codex mcp remove with the server name', async () => {
    const sut = await loadDisconnect();

    await sut({ serverName: 'confidence-flags', projectDir: '/project' });

    expect(execFile).toHaveBeenCalledWith(
      'codex',
      ['mcp', 'remove', 'confidence-flags'],
      undefined,
    );
  });
});
