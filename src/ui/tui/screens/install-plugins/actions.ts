import type { ChosenIde } from '@lib/session.js';
import type { PromptOption } from '../../components/PromptPanel.js';

export type IdeSelectValue = ChosenIde;

export type DetectedSelectValue = IdeSelectValue | 'continue';

export const IDE_SELECT_OPTIONS: PromptOption<ChosenIde>[] = [
  { label: 'Claude Code', value: 'claude' },
  { label: 'Cursor', value: 'cursor' },
  { label: 'Codex', value: 'codex' },
];

export type ErrorAction = 'retry' | 'exit';

export const ERROR_OPTIONS: PromptOption<ErrorAction>[] = [
  { label: 'Retry', value: 'retry' },
  { label: 'Exit', value: 'exit' },
];
