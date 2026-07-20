import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { Colors, Icons } from '../../styles.js';
import { PromptPanel } from '../../components/PromptPanel.js';
import { TwoColumnLayout } from '../../components/TwoColumnLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { buildWizardTasks } from '../../lib/wizard-tasks.js';
import { ScreenId } from '@lib/session.js';
import { useAutoAdvance } from '../../hooks/useAutoAdvance.js';
import { useLogger } from '../../hooks/useLog.js';
import { $session } from '../../store.js';
import { useAuthFlow } from './useAuthFlow.js';
import { track } from '@lib/telemetry.js';
import { authCompleted } from './log-messages.js';
import * as te from './telemetry-events.js';

export function AuthenticateScreen() {
  const log = useLogger(ScreenId.Authenticate);
  const { phase, error, workspace, startAuth, cancelAuth, confirmExisting, resetToChoose } =
    useAuthFlow();

  useAutoAdvance({
    screen: ScreenId.Authenticate,
    when: phase === 'authenticated',
    delay: 2000,
    onAdvance() {
      const auth = $session.get().authState;
      log(authCompleted(workspace, auth.region));
      track(te.authCompleted());
    },
  });

  const tasks = buildWizardTasks(
    'authenticate',
    phase === 'authenticated' ? 'done' : phase === 'failed' ? 'error' : 'active',
  );

  const left = (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={Colors.primary} bold>
          Sign in to Confidence
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={Colors.muted}>
          Sign in so the wizard can create flags and set up your project.
        </Text>
      </Box>

      {phase === 'checking' && <Spinner label="Checking for existing credentials..." />}

      {phase === 'waiting-browser' && (
        <Box flexDirection="column">
          <Spinner label="Waiting for browser login..." />
          <Box marginTop={1}>
            <Text color={Colors.muted}>
              Finish signing in in your browser. This will update when you're done.
            </Text>
          </Box>
        </Box>
      )}

      {phase === 'authenticated' && (
        <Box flexDirection="column">
          <Box gap={1}>
            <Text color={Colors.success}>{Icons.check}</Text>
            <Text>Authenticated{workspace ? ` as ${workspace}` : ''}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={Colors.success}>Continuing...</Text>
          </Box>
        </Box>
      )}

      {phase === 'failed' && (
        <Box flexDirection="column">
          <Text color={Colors.error}>Authentication failed: {error}</Text>
        </Box>
      )}
    </Box>
  );

  const right = <TaskList tasks={tasks} />;

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <TwoColumnLayout left={left} right={right} />
      {renderPromptPanel()}
    </Box>
  );

  function renderPromptPanel() {
    switch (phase) {
      case 'has-existing':
        return (
          <PromptPanel
            mode="select"
            status={`Found existing account${workspace ? ` (${workspace})` : ''}. What would you like to do?`}
            options={[
              { label: 'Use existing account', value: 'use-existing' },
              { label: 'Sign in to a different account', value: 'login' },
            ]}
            onSelect={(value) => {
              if (value === 'use-existing') {
                track(te.authExistingConfirmed());
                confirmExisting();
              } else {
                track(te.authBrowserStarted());
                startAuth('login');
              }
            }}
          />
        );
      case 'choose-action':
        return (
          <PromptPanel
            mode="select"
            status="We'll open your browser to sign in. Continue?"
            options={[{ label: 'Sign in to a Confidence account', value: 'login' }]}
            onSelect={() => {
              track(te.authBrowserStarted());
              startAuth('login');
            }}
          />
        );
      case 'failed':
        return (
          <PromptPanel
            mode="select"
            status="Authentication failed."
            options={[
              { label: 'Try again', value: 'retry' },
              { label: 'Quit', value: 'quit' },
            ]}
            onSelect={(value) => {
              if (value === 'retry') {
                track(te.authRetried());
                resetToChoose();
              } else {
                track(te.authQuit());
                process.exit(1);
              }
            }}
          />
        );
      case 'waiting-browser':
        return (
          <PromptPanel
            mode="info"
            status="Waiting for browser authentication..."
            onCancel={cancelAuth}
          />
        );
      case 'checking':
      case 'authenticated':
        return null;
      default: {
        const _exhaustive: never = phase satisfies never;
        throw new Error(`Unhandled phase: ${_exhaustive}`);
      }
    }
  }
}
