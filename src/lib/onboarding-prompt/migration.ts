import { loadStep } from './steps/load.js';

export function migrateFlags(
  migration: { providerName: string; skillName: string },
  step: number,
): string {
  return loadStep('migrate-flags.md', {
    STEP: step,
    PROVIDER_NAME: migration.providerName,
    SKILL_NAME: migration.skillName,
  });
}
