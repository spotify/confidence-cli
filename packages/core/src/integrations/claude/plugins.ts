import { resolve } from 'node:path';
import type { PluginScope } from '@spotify-confidence/shared-kernel';
import { execFile } from '../../exec/exec.js';
import { PLUGIN_NAME } from '../../constants.js';

const SCOPE_MAP: Record<PluginScope, string> = {
  project: 'project',
  local: 'local',
  global: 'user',
};

type PluginEntry = {
  id: string;
  enabled: boolean;
  scope: string;
  projectPath?: string;
};

export async function detectPlugin(projectDir: string): Promise<boolean> {
  try {
    const config = { cwd: projectDir, timeout: 5_000 };
    const result = await execFile('claude', ['plugin', 'list', '--json'], config);
    const plugins = JSON.parse(result.stdout) as PluginEntry[];
    return plugins.some((p) => isAvailable(p, projectDir));
  } catch {
    return false;
  }
}

export async function installPlugin(
  projectDir: string,
  scope: PluginScope = 'project',
): Promise<void> {
  await execFile('claude', ['plugin', 'install', PLUGIN_NAME, '--scope', SCOPE_MAP[scope]], {
    cwd: projectDir,
  });
}

export async function updatePlugin(
  projectDir: string,
  scope: PluginScope = 'project',
): Promise<void> {
  const pluginId = await resolvePluginId(projectDir);
  await execFile('claude', ['plugin', 'update', pluginId, '--scope', SCOPE_MAP[scope]], {
    cwd: projectDir,
  });
}

export async function uninstallPlugin(
  projectDir: string,
  scope: PluginScope = 'project',
): Promise<void> {
  await execFile('claude', ['plugin', 'uninstall', PLUGIN_NAME, '--scope', SCOPE_MAP[scope]], {
    cwd: projectDir,
  });
}

async function resolvePluginId(projectDir: string): Promise<string> {
  const { stdout } = await execFile('claude', ['plugin', 'list', '--json'], { cwd: projectDir });

  const plugins = JSON.parse(stdout) as PluginEntry[];
  const match = plugins.find((p) => p.id.startsWith(`${PLUGIN_NAME}@`));
  if (!match) {
    throw new Error(`Plugin "${PLUGIN_NAME}" is not installed`);
  }

  return match.id;
}

function isAvailable(plugin: PluginEntry, projectDir: string): boolean {
  if (!plugin.id.startsWith(`${PLUGIN_NAME}@`)) return false;
  if (!plugin.enabled) return false;
  if (plugin.scope === 'project' && resolve(plugin.projectPath ?? '') !== resolve(projectDir)) {
    return false;
  }

  return true;
}
