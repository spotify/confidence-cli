import type { PromptOption } from '../../components/PromptPanel.js';

export type FailAction = 'retry' | 'quit';

export const FAIL_OPTIONS: PromptOption<FailAction>[] = [
  { label: 'Retry', value: 'retry' },
  { label: 'Quit', value: 'quit' },
];
