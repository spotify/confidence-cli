import type { IdeId } from '@spotify-confidence/shared-kernel';
import { buildToolVars } from '../tool-vars.js';
import { loadStep } from '../steps/load.js';

export function sdkOnly(framework: string, projectDir: string, ide: IdeId): string {
  const tools = buildToolVars(ide);
  return loadStep('sdk-only.md', { FRAMEWORK: framework, PROJECT_DIR: projectDir, ...tools });
}
