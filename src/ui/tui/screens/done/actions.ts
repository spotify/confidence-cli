import type { OnboardingOutcome } from '@lib/session.js';
import type { PromptOption } from '../../components/PromptPanel.js';

export type DoneAction = 'chat' | 'exit';

export function doneOptions(
  ideName: string | null,
  outcome: OnboardingOutcome,
): PromptOption<DoneAction>[] {
  const chatLabel =
    outcome === 'cancelled' || outcome === 'failed'
      ? `Finish setup with ${ideName}`
      : `Continue work with ${ideName}`;

  return [
    ...(ideName ? [{ label: chatLabel, value: 'chat' as const }] : []),
    { label: 'Exit', value: 'exit' },
  ];
}
