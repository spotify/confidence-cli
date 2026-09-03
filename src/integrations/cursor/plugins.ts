import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { PLUGIN_REPO_URL } from '@lib/constants.js';
import type { PluginInstallationMethod } from '@shared-kernel/types.js';
import { hasDownloadedSkills } from '../skills/local.js';
import { skillsDir } from './paths.js';

const execFile = promisify(execFileCb);

export async function detectPlugin(projectDir: string): Promise<PluginInstallationMethod | null> {
  return hasDownloadedSkills(skillsDir(projectDir)) ? 'download' : null;
}

export async function installPlugin(projectDir: string): Promise<void> {
  await execFile('cursor', ['agent', 'plugin', 'marketplace', 'add', PLUGIN_REPO_URL], {
    cwd: projectDir,
  });

  throw new Error('Cursor does not support CLI plugin installation yet.');
}
