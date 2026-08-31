import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { PLUGIN_NAME } from '@lib/constants.js';
import type { PluginInstallationMethod } from '../types.js';
import { hasDownloadedSkills } from '../skills/local.js';
import { skillsDir } from './paths.js';

const execFile = promisify(execFileCb);

export async function detectPlugin(projectDir: string): Promise<PluginInstallationMethod | null> {
  try {
    const { stdout } = await execFile('claude', ['plugin', 'list', '--json'], {
      cwd: projectDir,
    });
    const plugins = JSON.parse(stdout) as Array<{ id: string }>;
    if (plugins.some((p) => p.id.startsWith(`${PLUGIN_NAME}@`))) return 'cli';
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
