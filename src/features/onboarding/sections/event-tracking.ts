import type { ChosenIde, PluginInstallationMethod } from '@shared-kernel/types.js';
import { loadStep } from '../steps/load.js';
import { referenceInstruction } from '../tool-vars.js';

export function instrumentEvents(
  framework: string,
  step: number,
  isEmptyProject: boolean,
  ide: ChosenIde,
  pluginInstallMethod?: PluginInstallationMethod | null,
): string {
  return loadStep('instrument-events.md', {
    STEP: step,
    FRAMEWORK: framework,
    SKILL_READ_INSTRUCTION: referenceInstruction('instrument-events', ide, pluginInstallMethod),
    DOMAIN_CONTEXT: isEmptyProject
      ? "The project was just scaffolded — treat the sample app's features as the domain."
      : "Study the project's codebase to understand its domain, UI flows, and business logic.",
  });
}
