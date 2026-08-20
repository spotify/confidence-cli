import type { ChosenIde } from '../session.js';
import { loadStep } from './steps/load.js';

const SKILLS_DIR: Record<ChosenIde, string> = {
  claude: '.claude/skills',
  cursor: '.cursor/skills',
  codex: '.agents/skills',
};

export function instrumentEvents(
  framework: string,
  step: number,
  isEmptyProject: boolean,
  ide: ChosenIde,
): string {
  return loadStep('instrument-events.md', {
    STEP: step,
    FRAMEWORK: framework,
    SKILLS_DIR: SKILLS_DIR[ide],
    DOMAIN_CONTEXT: isEmptyProject
      ? "The project was just scaffolded — treat the sample app's features as the domain."
      : "Study the project's codebase to understand its domain, UI flows, and business logic.",
  });
}
