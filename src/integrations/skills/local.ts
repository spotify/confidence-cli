import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SKILLS_BASE_URL } from '@lib/constants.js';

const SKILL_NAMES = [
  'analyze-project',
  'instrument-events',
  'onboard-confidence',
  'setup-warehouse',
  'setup-warehouse-bigquery',
  'setup-warehouse-databricks',
  'setup-warehouse-redshift',
  'setup-warehouse-snowflake',
  'migrate-eppo',
  'migrate-optimizely',
  'migrate-posthog',
  'migrate-statsig',
] as const;

export function hasDownloadedSkills(skillsDir: string): boolean {
  return SKILL_NAMES.some((name) => existsSync(join(skillsDir, name, 'SKILL.md')));
}

export async function downloadSkills(skillsDir: string): Promise<void> {
  await Promise.all(
    SKILL_NAMES.map(async (name) => {
      const destDir = join(skillsDir, name);
      const destFile = join(destDir, 'SKILL.md');
      if (existsSync(destFile)) return;

      const url = `${SKILLS_BASE_URL}/${name}/SKILL.md`;
      const res = await fetch(url);
      if (!res.ok) return;

      const content = await res.text();
      await mkdir(destDir, { recursive: true });
      await writeFile(destFile, content, 'utf-8');
    }),
  );
}
