import { PromptPanel } from '../../../components/PromptPanel.js';
import type { GoalSelection } from '../useGoalSelection.js';
import { goalOptionsFor } from '../actions.js';

type GoalSelectionProps = {
  goalSelection: GoalSelection;
};

export function BottomPrompt({ goalSelection }: GoalSelectionProps) {
  switch (goalSelection.phase) {
    case 'select-goal':
      return (
        <PromptPanel
          mode="select"
          status="Select features to set up:"
          options={goalOptionsFor(goalSelection.recordingAvailable)}
          onSelect={goalSelection.selectGoal}
        />
      );
    case 'done':
      return null;
    default: {
      const _exhaustive: never = goalSelection.phase satisfies never;
      throw new Error(`Unhandled phase: ${_exhaustive}`);
    }
  }
}
