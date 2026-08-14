import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { Colors, Icons } from '../../styles.js';
import { PromptPanel } from '../../components/PromptPanel.js';
import { MainLayout } from '../../components/MainLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { buildWizardTasks } from '../../lib/wizard-tasks.js';
import { type IdeId, getIntegrations } from '@integrations/index.js';
import { PLUGINS_REPO_URL } from '@lib/constants.js';
import { ScreenId } from '@lib/session.js';
import { useAutoAdvance } from '../../hooks/useAutoAdvance.js';
import { useLogger } from '../../hooks/useLog.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { skipped } from '../../lib/log-messages.js';
import { $session, store } from '../../store.js';
import { usePluginInstall } from './usePluginInstall.js';
import { track } from '@lib/telemetry.js';
import {
  pluginsAlreadyInstalled,
  pluginInstalled,
  pluginSkippedAfterError,
} from './log-messages.js';
import * as te from './telemetry-events.js';
import {
  IDE_SELECT_OPTIONS,
  ERROR_OPTIONS,
  type IdeSelectValue,
  type DetectedSelectValue,
  type ErrorAction,
} from './actions.js';

const ALL_INTEGRATIONS = getIntegrations();

const IDE_LABELS = Object.fromEntries(ALL_INTEGRATIONS.map((i) => [i.id, i.name])) as Record<
  IdeId,
  string
>;

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
    if (value === 'skip') {
      track(te.pluginSkipped());
      log(skipped());
      navigate.to('next');
      return;
    }
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

  const tasks = buildWizardTasks(
    'installPlugins',
    phase === 'installed' || phase === 'already-installed'
      ? 'done'
      : phase === 'error'
        ? 'error'
        : 'active',
  );

  const main = (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={Colors.primary} bold>
          Teach your AI Confidence
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={Colors.muted}>
          Plugins give your agent tool Confidence-specific skills — flag management, warehouse
          setup, migrations, onboarding — no more searching docs yourself.
        </Text>
      </Box>

      {phase === 'detecting' && <Spinner label="Checking for Confidence AI plugins..." />}

      {phase === 'already-installed' && (
        <>
          <Text>Detected Confidence plugins for:</Text>
          {detected.map((d) => (
            <Box key={d} gap={1}>
              <Text color={Colors.success}>{Icons.check}</Text>
              <Text>{IDE_LABELS[d] ?? d}</Text>
            </Box>
          ))}
        </>
      )}

      {phase === 'installing' && <Spinner label="Installing Confidence plugin..." />}

      {phase === 'installed' && (
        <Box>
          <Text color={Colors.success}>Plugin installed successfully. Continuing...</Text>
        </Box>
      )}

      {phase === 'error' && (
        <Box flexDirection="column">
          <Text color={Colors.error}>Failed to install plugin: {error}</Text>
          <Box marginTop={1}>
            <Text color={Colors.muted}>
              You can install manually from: <Text color={Colors.primary}>{PLUGINS_REPO_URL}</Text>
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );

  const aside = <TaskList tasks={tasks} />;

  return <MainLayout main={main} aside={aside} prompt={renderPromptPanel()} />;

  function renderPromptPanel() {
    switch (phase) {
      case 'choose-ide':
        return (
          <PromptPanel
            mode="select"
            status="Which CLI agent would you like to use?"
            options={IDE_SELECT_OPTIONS}
            onSelect={handleIdeSelect}
          />
        );
      case 'error':
        return (
          <PromptPanel
            mode="select"
            status="Plugin installation failed."
            options={ERROR_OPTIONS}
            onSelect={(value: ErrorAction) => {
              if (value === 'retry') {
                const ide = $session.get().ide;
                if (ide) selectIde(ide);
                return;
              }

              track(te.pluginSkippedAfterError());
              log(pluginSkippedAfterError(error));
              navigate.to('next');
            }}
          />
        );
      case 'already-installed': {
        const preferredLabel = preferredIndex ? IDE_LABELS[preferredIndex] : null;
        const otherOptions = ALL_INTEGRATIONS.filter((i) => i.id !== preferredIndex).map((i) => ({
          label: i.name,
          value: i.id,
        }));

        return (
          <PromptPanel
            mode="select"
            status={`Confidence plugin detected for ${preferredLabel}. Continue with this agent tool?`}
            options={[
              { label: `Continue with ${preferredLabel}`, value: 'continue' },
              ...otherOptions,
              { label: 'Skip (install manually later)', value: 'skip' },
            ]}
            onSelect={handleDetectedSelect}
          />
        );
      }
      case 'detecting':
      case 'installing':
      case 'installed':
        return null;
      default: {
        const _exhaustive: never = phase satisfies never;
        throw new Error(`Unhandled phase: ${_exhaustive}`);
      }
    }
  }
}
