import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { Colors, Icons } from '../../styles.js';
import { MainLayout } from '../../components/MainLayout.js';
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
import { BottomPrompt } from './components/index.js';

export function AuthenticateScreen() {
  const log = useLogger(ScreenId.Authenticate);
  const { phase, error, notice, workspace, startAuth, cancelAuth, confirmExisting, resetToChoose } =
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

  const main = (
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

      {notice && (
        <Box marginBottom={1}>
          <Text color={Colors.warning}>{notice}</Text>
        </Box>
      )}

      {phase === 'checking' && <Spinner label="Verifying selected account..." />}

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

  return (
    <MainLayout
      main={main}
      aside={<TaskList tasks={tasks} />}
      prompt={
        <BottomPrompt
          phase={phase}
          workspace={workspace}
          onUseExisting={() => {
            track(te.authExistingConfirmed());
            confirmExisting();
          }}
          onLogin={() => {
            track(te.authBrowserStarted());
            startAuth('login');
          }}
          onRetry={() => {
            track(te.authRetried());
            resetToChoose();
          }}
          onQuit={() => {
            track(te.authQuit());
            process.exit(1);
          }}
          onCancelBrowser={cancelAuth}
        />
      }
    />
  );
}
