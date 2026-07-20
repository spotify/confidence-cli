import { useCallback, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { Colors, Icons } from '../../styles.js';
import { PromptPanel } from '../../components/PromptPanel.js';
import { TwoColumnLayout } from '../../components/TwoColumnLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { buildWizardTasks } from '../../lib/wizard-tasks.js';
import { ScreenId } from '@lib/session.js';
import { useLogger } from '../../hooks/useLog.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { useSystemCheck } from './useSystemCheck.js';
import { track } from '@lib/telemetry.js';
import { systemCheckPassed, systemCheckQuit } from './log-messages.js';
import * as te from './telemetry-events.js';

export function SystemCheckScreen() {
  const navigate = useNavigation(ScreenId.SystemCheck);
  const log = useLogger(ScreenId.SystemCheck);
  const { checks, running, allPassed, hasFailed, retry } = useSystemCheck();

  const formatChecksOutput = useCallback(
    function formatChecksOutput(): string {
      return checks
        .map((c) => `${c.name} ${c.found ? '✔' : '✘'}${c.version ? ' ' + c.version : ''}`)
        .join(', ');
    },
    [checks],
  );

  useEffect(
    function autoAdvanceAfterChecks() {
      if (allPassed && !running) {
        const timer = setTimeout(() => {
          log(systemCheckPassed(formatChecksOutput()));
          track(te.systemCheckPassed());
          navigate.to('next');
        }, 1500);
        return () => clearTimeout(timer);
      }
    },
    [allPassed, running, navigate, log, formatChecksOutput],
  );

  const tasks = buildWizardTasks('systemCheck', running ? 'active' : allPassed ? 'done' : 'error');

  const left = (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={Colors.primary} bold>
          System Check
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={Colors.muted}>Checking that your system has everything we need.</Text>
      </Box>
      {running && (
        <Box marginBottom={1}>
          <Spinner label="Checking required tools..." />
        </Box>
      )}
      {checks.map((check) => (
        <Box key={check.name} gap={1}>
          <Text color={check.found ? Colors.success : Colors.error}>
            {check.found ? Icons.check : Icons.cross}
          </Text>
          <Text>{check.name}</Text>
          {check.version && <Text color={Colors.muted}>{check.version}</Text>}
        </Box>
      ))}
      {allPassed && (
        <Box marginTop={1}>
          <Text color={Colors.success}>All checks passed. Continuing...</Text>
        </Box>
      )}
      {hasFailed && (
        <Box marginTop={1}>
          <Text color={Colors.error}>Some required tools are missing. Install them and retry.</Text>
        </Box>
      )}
    </Box>
  );

  const right = <TaskList tasks={tasks} />;

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <TwoColumnLayout left={left} right={right} />
      {hasFailed && (
        <PromptPanel
          mode="select"
          status="Required tools are missing."
          options={[
            { label: 'Retry', value: 'retry' },
            { label: 'Quit', value: 'quit' },
          ]}
          onSelect={(value) => {
            if (value === 'retry') {
              track(te.systemCheckRetried());
              retry();
            } else {
              track(te.systemCheckQuit());
              log(systemCheckQuit(formatChecksOutput()));
              process.exit(1);
            }
          }}
        />
      )}
      {running && <PromptPanel mode="info" status="Running system checks..." />}
    </Box>
  );
}
