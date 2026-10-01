import type { PromptOption } from '../../components/PromptPanel.js';

export type ExistingAction = 'use-existing' | 'login';

export const EXISTING_OPTIONS: PromptOption<ExistingAction>[] = [
  { label: 'Use existing account', value: 'use-existing' },
  { label: 'Sign in to a different account', value: 'login' },
];

export type FailAction = 'retry' | 'quit';

export const FAIL_OPTIONS: PromptOption<FailAction>[] = [
  { label: 'Try again', value: 'retry' },
  { label: 'Quit', value: 'quit' },
];
