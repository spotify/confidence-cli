import { basename } from 'node:path';
import { CONFIDENCE_DOCS_URL } from '@lib/constants.js';
import { loadStep } from '../steps/load.js';

type IntegrateRecordingParams = {
  step: number;
  isEmptyProject: boolean;
  framework: string;
  projectDir: string;
  toolVars: Record<string, string>;
};

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

export function integrateRecording({
  step,
  isEmptyProject,
  framework,
  projectDir,
  toolVars,
}: IntegrateRecordingParams): string {
  return loadStep('integrate-recording.md', {
    STEP: step,
    PROJECT_NAME: basename(projectDir) || framework,
    DOCS_URL: CONFIDENCE_DOCS_URL,
    ANALYSIS_CONTEXT: isEmptyProject
      ? "The project was just scaffolded — configure recording on the sample app's main view."
      : "Identify the app's entry point or root layout where the session recorder should be initialized.",
    ...toolVars,
  });
}
