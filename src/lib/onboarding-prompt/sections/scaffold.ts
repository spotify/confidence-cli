import { loadStep } from '../steps/load.js';

export function scaffold(framework: string, step: number): string {
  return loadStep('scaffold.md', { STEP: step, FRAMEWORK: framework });
}
