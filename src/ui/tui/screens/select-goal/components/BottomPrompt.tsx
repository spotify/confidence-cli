import { PromptPanel } from '../../../components/PromptPanel.js';
import type { GoalSelection } from '../useGoalSelection.js';
import { goalOptionsFor } from '../actions.js';

type GoalSelectionProps = {
  goalSelection: GoalSelection;
};

export function BottomPrompt({ goalSelection }: GoalSelectionProps) {
  return (
    <PromptPanel
      mode="multi-select"
      status="Toggle features to set up (select none to skip):"
      options={goalOptionsFor(goalSelection.recordingAvailable)}
      onSubmit={goalSelection.submitGoals}
    />
  );
}
