import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLUGIN_SKILLS, installSkills } from '../shared.js';
import { globalConfigPath, projectConfigPath, skillsDir } from './paths.js';

export function detectPlugins(projectDir: string): boolean {
  return hasMcpServers(projectDir) || hasSkillFiles(projectDir);
}

export async function installPlugins(projectDir: string): Promise<void> {
  await installSkills(skillsDir(projectDir));
}

function hasMcpServers(projectDir: string): boolean {
  const paths = [globalConfigPath(), projectConfigPath(projectDir)];
  return paths.some((configPath) => {
    try {
      const content = readFileSync(configPath, 'utf-8');
      return content.includes('confidence-flags') || content.includes('confidence-docs');
    } catch {
      return false;
    }
  });
}

function hasSkillFiles(projectDir: string): boolean {
  const dir = skillsDir(projectDir);
  return PLUGIN_SKILLS.some((name) => existsSync(join(dir, name, 'SKILL.md')));
}
