import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SKILLS_BASE_URL } from '../../constants.js';
import { getConfigDir } from '../../config/paths.js';
import { SKILL_NAMES } from './const.js';

export function getSkillsDir(): string {
  return join(getConfigDir(), 'skills');
}

export function hasSkills(): boolean {
  return SKILL_NAMES.some((name) => existsSync(join(getSkillsDir(), name, 'SKILL.md')));
}

export async function removeSkills(skillsDir: string): Promise<void> {
  await Promise.all(
    SKILL_NAMES.map((name) => rm(join(skillsDir, name), { recursive: true, force: true })),
  );
}

export async function downloadSkills(skillsDir: string, force = false): Promise<boolean> {
  const results = await Promise.allSettled(
    SKILL_NAMES.map(async (name) => {
      const destDir = join(skillsDir, name);
      const destFile = join(destDir, 'SKILL.md');
      if (existsSync(destFile) && !force) return true;

      const res = await fetch(`${SKILLS_BASE_URL}/${name}/SKILL.md`);
      if (!res.ok) return false;

      const content = await res.text();
      await mkdir(destDir, { recursive: true });
      await writeFile(destFile, content, 'utf-8');
      return true;
    }),
  );

  return results.some((r) => r.status === 'fulfilled' && r.value);
}
