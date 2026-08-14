import { Box } from 'ink';
import { MainLayout } from '../../components/MainLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { buildWizardTasks } from '../../lib/wizard-tasks.js';
import { useGoalSelection } from './useGoalSelection.js';
import { LeftPanel, BottomPrompt } from './components/index.js';

const WIZARD_TASKS = buildWizardTasks('onboardProject', 'active');

export function SelectGoalScreen() {
  const goalSelection = useGoalSelection();

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <MainLayout
        main={<LeftPanel goalSelection={goalSelection} />}
        aside={<TaskList tasks={WIZARD_TASKS} />}
      />
      <BottomPrompt goalSelection={goalSelection} />
    </Box>
  );
}
