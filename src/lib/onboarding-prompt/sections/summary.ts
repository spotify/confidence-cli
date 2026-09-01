import { loadStep } from '../steps/load.js';

export function summary(step: number): string {
  return loadStep('summary.md', { STEP: step });
}

export function rules(): string {
  return loadStep('rules.md');
}
