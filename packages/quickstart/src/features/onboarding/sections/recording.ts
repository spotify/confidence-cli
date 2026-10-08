import { loadStep } from '../steps/load.js';
import { referenceInstruction } from '../tool-vars.js';

export function integrateRecording(
  framework: string,
  step: number,
  isEmptyProject: boolean,
): string {
  return loadStep('integrate-recording.md', {
    STEP: step,
    FRAMEWORK: framework,
    SKILL_READ_INSTRUCTION: referenceInstruction('setup-session-recording'),
    DOMAIN_CONTEXT: isEmptyProject
      ? "The project was just scaffolded — configure recording on the sample app's main view."
      : "Identify the app's entry point or root layout where the session recorder should be initialized.",
  });
}
