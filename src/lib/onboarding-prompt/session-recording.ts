import { CONFIDENCE_DOCS_URL } from '../constants.js';
import { loadStep } from './steps/load.js';

export function determineRecordingSDK(
  framework: string,
  step: number,
  toolVars: Record<string, string>,
): string {
  return loadStep('determine-recording-sdk.md', {
    STEP: step,
    FRAMEWORK: framework,
    DOCS_URL: CONFIDENCE_DOCS_URL,
    ...toolVars,
  });
}

export function integrateRecording(step: number, isEmptyProject: boolean): string {
  return loadStep('integrate-recording.md', {
    STEP: step,
    ANALYSIS_CONTEXT: isEmptyProject
      ? "The project was just scaffolded — configure recording on the sample app's main view."
      : "Identify the app's entry point or root layout where the session recorder should be initialized.",
  });
}
