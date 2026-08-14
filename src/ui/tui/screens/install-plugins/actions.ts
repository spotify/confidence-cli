import type { ChosenIde } from '@lib/session.js';
import type { PromptOption } from '../../components/PromptPanel.js';

export type IdeSelectValue = ChosenIde | 'skip';

export type DetectedSelectValue = IdeSelectValue | 'continue';

export const IDE_SELECT_OPTIONS: PromptOption<IdeSelectValue>[] = [
  { label: 'Claude Code', value: 'claude' },
  { label: 'Cursor', value: 'cursor' },
  { label: 'Codex', value: 'codex' },
  { label: 'Skip (install manually later)', value: 'skip' },
];

export type ErrorAction = 'retry' | 'skip';

export const ERROR_OPTIONS: PromptOption<ErrorAction>[] = [
  { label: 'Retry', value: 'retry' },
  { label: 'Skip', value: 'skip' },
];
