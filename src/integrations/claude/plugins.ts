import { execFile as execFileCb } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { PLUGIN_NAME } from '@lib/constants.js';
import type { PluginInstallationMethod } from '../types.js';
import { hasDownloadedSkills } from '../skills/local.js';
import { skillsDir } from './paths.js';

const execFile = promisify(execFileCb);

type PluginEntry = {
  id: string;
  enabled: boolean;
  scope: string;
  projectPath?: string;
};

export async function detectPlugin(projectDir: string): Promise<PluginInstallationMethod | null> {
  try {
    const cwd = projectDir;
    const { stdout } = await execFile('claude', ['plugin', 'list', '--json'], { cwd });
    const plugins = JSON.parse(stdout) as PluginEntry[];

    if (plugins.some((p) => isAvailable(p, projectDir))) return 'cli';
  } catch {
    // CLI unavailable; fallback to locally downloaded files.
  }

  return hasDownloadedSkills(skillsDir(projectDir)) ? 'download' : null;
}

export async function installPlugin(projectDir: string): Promise<void> {
  await execFile('claude', ['plugin', 'install', PLUGIN_NAME, '--scope', 'project'], {
    cwd: projectDir,
  });
}

function isAvailable(plugin: PluginEntry, projectDir: string): boolean {
  if (!plugin.id.startsWith(`${PLUGIN_NAME}@`)) return false;
  if (!plugin.enabled) return false;
  if (plugin.scope === 'project' && resolve(plugin.projectPath ?? '') !== resolve(projectDir)) {
    return false;
  }

  return true;
}
