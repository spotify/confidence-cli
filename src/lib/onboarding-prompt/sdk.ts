import { CONFIDENCE_DOCS_URL } from '../constants.js';
import { loadStep } from './steps/load.js';

export function determineSDK(
  framework: string,
  step: number,
  toolVars: Record<string, string>,
): string {
  return loadStep('determine-sdk.md', {
    STEP: step,
    FRAMEWORK: framework,
    DOCS_URL: CONFIDENCE_DOCS_URL,
    ...toolVars,
  });
}

export function resolveClient(
  framework: string,
  step: number,
  toolVars: Record<string, string>,
): string {
  return loadStep('resolve-client.md', { STEP: step, FRAMEWORK: framework, ...toolVars });
}
