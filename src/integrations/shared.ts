import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SKILLS_BASE_URL } from '@lib/constants.js';

export const PLUGIN_SKILLS = [
  'onboard-confidence',
  'onboard-confidence-dry-run',
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

export function hasConfidenceServers(servers: Record<string, unknown>): boolean {
  return 'confidence-flags' in servers || 'confidence-docs' in servers;
}

export async function installSkills(skillsDir: string): Promise<void> {
  await Promise.all(
    PLUGIN_SKILLS.map(async (name) => {
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
