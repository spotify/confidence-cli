import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PLUGIN_SKILLS, installSkills } from '../shared.js';
import { skillsDir } from './paths.js';

export function detectPlugins(projectDir: string): boolean {
  return hasSkillFiles(projectDir);
}

export async function installPlugins(projectDir: string): Promise<void> {
  await installSkills(skillsDir(projectDir));
}

function hasSkillFiles(projectDir: string): boolean {
  const dir = skillsDir(projectDir);
  return PLUGIN_SKILLS.some((name) => existsSync(join(dir, name, 'SKILL.md')));
}
