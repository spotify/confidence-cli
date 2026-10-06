import { execFile } from '../../exec/exec.js';
import { PLUGIN_REPO_URL } from '../../constants.js';
import type { PluginInstallationMethod } from '@spotify-confidence/shared-kernel';
import { hasDownloadedSkills } from '../skills/local.js';
import { skillsDir } from './paths.js';

export async function detectPlugin(projectDir: string): Promise<PluginInstallationMethod | null> {
  return hasDownloadedSkills(skillsDir(projectDir)) ? 'download' : null;
}

export async function installPlugin(projectDir: string): Promise<void> {
  await execFile('cursor', ['agent', 'plugin', 'marketplace', 'add', PLUGIN_REPO_URL], {
    cwd: projectDir,
  });

  throw new Error("Cursor doesn't support CLI plugin installation yet.");
}

export async function updatePlugin(_projectDir: string): Promise<void> {
  throw new Error("Cursor doesn't support CLI plugin updates yet.");
}

export async function uninstallPlugin(projectDir: string): Promise<void> {
  await execFile('cursor', ['agent', 'plugin', 'marketplace', 'remove', PLUGIN_REPO_URL], {
    cwd: projectDir,
  });
}
