import { CONFIDENCE_DOCS_URL } from '../constants.js';
import { loadStep } from './steps/load.js';

export function preflight(toolVars: Record<string, string>): string {
  return loadStep('preflight.md', { DOCS_URL: CONFIDENCE_DOCS_URL, ...toolVars });
}

export function scaffold(framework: string, step: number): string {
  return loadStep('scaffold.md', { STEP: step, FRAMEWORK: framework });
}
