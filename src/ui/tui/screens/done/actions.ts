import type { PromptOption } from '../../components/PromptPanel.js';

export type DoneAction = 'chat' | 'exit';

export function doneOptions(ideName: string | null): PromptOption<DoneAction>[] {
  return [
    ...(ideName ? [{ label: `Continue work with ${ideName}`, value: 'chat' as const }] : []),
    { label: 'Exit', value: 'exit' },
  ];
}
