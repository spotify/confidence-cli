import { useSession } from '../../../store.js';
import { PromptPanel } from '../../../components/PromptPanel.js';
import type { GoalSelection } from '../useGoalSelection.js';
import {
  type IncompatibleAction,
  INCOMPATIBLE_OPTIONS_WITH_FALLBACK,
  INCOMPATIBLE_OPTIONS_QUIT_ONLY,
} from '../actions.js';

type IncompatiblePromptProps = {
  goalSelection: GoalSelection;
};

export function IncompatiblePrompt({ goalSelection }: IncompatiblePromptProps) {
  const session = useSession();
  const hasOtherGoals = session.onboardingGoals.some((g) => g !== 'session-recordings');
  const options = hasOtherGoals
    ? INCOMPATIBLE_OPTIONS_WITH_FALLBACK
    : INCOMPATIBLE_OPTIONS_QUIT_ONLY;

  function handleSelect(value: IncompatibleAction) {
    if (value === 'continue') {
      goalSelection.continueWithoutRecordings();
    } else {
      process.exit(1);
    }
  }

  return (
    <PromptPanel
      mode="select"
      status="Session recordings are not available for this SDK."
      options={options}
      onSelect={handleSelect}
    />
  );
}
