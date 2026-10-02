import { MainLayout } from '../../components/MainLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { useWizardTasks } from '../../hooks/useWizardTasks.js';
import { useGoalSelection } from './useGoalSelection.js';
import {
  LeftPanel,
  IncompatiblePanel,
  BottomPrompt,
  IncompatiblePrompt,
} from './components/index.js';

export function SelectGoalScreen() {
  const goalSelection = useGoalSelection();
  const incompatible = goalSelection.incompatiblePreset;
  const tasks = useWizardTasks('selectGoal', incompatible ? 'error' : 'active');

  return (
    <MainLayout
      main={incompatible ? <IncompatiblePanel /> : <LeftPanel />}
      aside={<TaskList tasks={tasks} />}
      prompt={
        incompatible ? (
          <IncompatiblePrompt goalSelection={goalSelection} />
        ) : (
          <BottomPrompt goalSelection={goalSelection} />
        )
      }
    />
  );
}
