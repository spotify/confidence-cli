import type { OnboardingOutcome } from '@lib/session.js';
import { Colors, Icons } from '../../styles.js';

type Headline = { icon: string; color: string; title: string };

export function headlineFor(outcome: OnboardingOutcome): Headline {
  switch (outcome) {
    case 'completed':
      return { icon: Icons.check, color: Colors.success, title: 'Confidence is ready!' };
    case 'skipped':
      return { icon: Icons.diamond, color: Colors.muted, title: 'Onboarding skipped' };
    case 'cancelled':
      return { icon: Icons.diamond, color: Colors.warning, title: 'Onboarding cancelled' };
    case 'failed':
      return { icon: Icons.cross, color: Colors.error, title: "Onboarding didn't finish" };
    default: {
      const _exhaustive: never = outcome satisfies never;
      throw new Error(`Unhandled outcome: ${_exhaustive}`);
    }
  }
}
