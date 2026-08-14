import { MainLayout } from '../../components/MainLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { buildWizardTasks } from '../../lib/wizard-tasks.js';
import { useGoalSelection } from './useGoalSelection.js';
import { LeftPanel, BottomPrompt } from './components/index.js';

const WIZARD_TASKS = buildWizardTasks('onboardProject', 'active');

export function SelectGoalScreen() {
  const goalSelection = useGoalSelection();

  return (
    <MainLayout
      main={<LeftPanel goalSelection={goalSelection} />}
      aside={<TaskList tasks={WIZARD_TASKS} />}
      prompt={<BottomPrompt goalSelection={goalSelection} />}
    />
  );
}
