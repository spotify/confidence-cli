import { getIntegrations } from '@integrations/index.js';
import { ScreenId } from '@lib/session.js';
import { MainLayout } from '../../components/MainLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { useAutoAdvance } from '../../hooks/useAutoAdvance.js';
import { useLogger } from '../../hooks/useLog.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { buildWizardTasks } from '../../lib/wizard-tasks.js';
import { $session, store } from '../../store.js';
import { usePluginInstall } from './usePluginInstall.js';
import { track } from '@lib/telemetry.js';
import {
  pluginsAlreadyInstalled,
  pluginInstalled,
  pluginExitedAfterError,
} from './log-messages.js';
import * as te from './telemetry-events.js';
import { type IdeSelectValue, type DetectedSelectValue, type ErrorAction } from './actions.js';
import { BottomPrompt, MainContent } from './components/index.js';

const ALL_INTEGRATIONS = getIntegrations();

export function InstallPluginsScreen() {
  const navigate = useNavigation(ScreenId.InstallPlugins);
  const log = useLogger(ScreenId.InstallPlugins);
  const { phase, detected, error, selectIde } = usePluginInstall();

  useAutoAdvance({
    screen: ScreenId.InstallPlugins,
    when: phase === 'installed',
    delay: 1500,
    onAdvance() {
      log(pluginInstalled($session.get().ide));
      track(te.pluginInstallCompleted());
    },
  });

  function handleIdeSelect(value: IdeSelectValue) {
    track(te.pluginIdeSelected(value));
    selectIde(value);
  }

  const preferredIndex = ALL_INTEGRATIONS.map((i) => i.id).find((id) => detected.includes(id));

  function handleDetectedSelect(value: DetectedSelectValue) {
    if (value === 'continue') {
      if (!preferredIndex) return;

      store.setIde(preferredIndex);
      log(pluginsAlreadyInstalled(detected));
      track(te.pluginsAlreadyDetected());
      navigate.to('next');
      return;
    }
    handleIdeSelect(value);
  }

  function handleError(value: ErrorAction) {
    if (value === 'exit') {
      log(pluginExitedAfterError(error));
      track(te.pluginExitedAfterError());
      return process.exit(1);
    }

    const ide = $session.get().ide;
    if (ide) selectIde(ide);
  }

  const tasks = buildWizardTasks(
    'installPlugins',
    phase === 'installed' || phase === 'already-installed'
      ? 'done'
      : phase === 'error'
        ? 'error'
        : 'active',
  );

  return (
    <MainLayout
      main={<MainContent phase={phase} detected={detected} error={error} />}
      aside={<TaskList tasks={tasks} />}
      prompt={
        <BottomPrompt
          phase={phase}
          detected={detected}
          onIdeSelect={handleIdeSelect}
          onDetectedSelect={handleDetectedSelect}
          onError={handleError}
        />
      }
    />
  );
}
