import type { PromptOption } from '../../components/PromptPanel.js';

export type ConfirmAction = 'start' | 'skip';

export const CONFIRM_OPTIONS: PromptOption<ConfirmAction>[] = [
  { label: 'Start onboarding', value: 'start' },
  { label: 'Skip for now', value: 'skip' },
];

export type ErrorAction = 'retry' | 'skip';

export const ERROR_OPTIONS: PromptOption<ErrorAction>[] = [
  { label: 'Retry', value: 'retry' },
  { label: 'Skip', value: 'skip' },
];
