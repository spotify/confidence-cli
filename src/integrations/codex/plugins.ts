import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { PLUGIN_MARKETPLACE_REPO, PLUGIN_MARKETPLACE_NAME, PLUGIN_NAME } from '@lib/constants.js';
import type { PluginInstallationMethod } from '@shared-kernel/types.js';
import { hasDownloadedSkills } from '../skills/local.js';
import { skillsDir } from './paths.js';

const execFile = promisify(execFileCb);

export async function detectPlugin(projectDir: string): Promise<PluginInstallationMethod | null> {
  try {
    const cwd = projectDir;
    const { stdout } = await execFile('codex', ['plugin', 'list', '--json'], { cwd });
    const { installed } = JSON.parse(stdout) as { installed: Array<{ pluginId: string }> };
    if (installed.some((p) => p.pluginId.startsWith(`${PLUGIN_NAME}@`))) return 'cli';
  } catch {
    // CLI unavailable; fallback to locally downloaded files.
  }

  return hasDownloadedSkills(skillsDir(projectDir)) ? 'download' : null;
}

export async function installPlugin(projectDir: string): Promise<void> {
  const cwd = projectDir;
  await execFile('codex', ['plugin', 'marketplace', 'add', PLUGIN_MARKETPLACE_REPO], { cwd });
  await execFile('codex', ['plugin', 'add', `${PLUGIN_NAME}@${PLUGIN_MARKETPLACE_NAME}`], { cwd });
}
