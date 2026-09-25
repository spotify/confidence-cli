import { basename, dirname, resolve } from 'node:path';
import { CONFIDENCE_DOCS_URL } from '@lib/constants.js';
import { loadStep } from '../steps/load.js';

const FALLBACK_PROJECT_NAME = 'project';

type IntegrateRecordingParams = {
  step: number;
  isEmptyProject: boolean;
  projectDir: string;
  toolVars: Record<string, string>;
};

export function projectDisplayName(projectDir: string): string {
  return basename(resolve(projectDir)) || FALLBACK_PROJECT_NAME;
}

export function projectParentName(projectDir: string): string {
  return basename(dirname(resolve(projectDir))) || FALLBACK_PROJECT_NAME;
}

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
  projectDir,
  toolVars,
}: IntegrateRecordingParams): string {
  return loadStep('integrate-recording.md', {
    STEP: step,
    PROJECT_NAME: projectDisplayName(projectDir),
    PARENT_NAME: projectParentName(projectDir),
    DOCS_URL: CONFIDENCE_DOCS_URL,
    ANALYSIS_CONTEXT: isEmptyProject
      ? "The project was just scaffolded — configure recording on the sample app's main view."
      : "Identify the app's entry point or root layout where the session recorder should be initialized.",
    ...toolVars,
  });
}
