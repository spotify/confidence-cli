import { useMemo } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { Colors, Icons } from '../../styles.js';
import { PromptPanel } from '../../components/PromptPanel.js';
import { TwoColumnLayout } from '../../components/TwoColumnLayout.js';
import { TaskList } from '../../components/TaskList.js';
import { buildWizardTasks } from '../../lib/wizard-tasks.js';
import type { McpServerStatus } from '@integrations/index.js';
import { CONFIDENCE_DOCS_URL } from '@lib/constants.js';
import { ScreenId } from '@lib/session.js';
import { useAutoAdvance } from '../../hooks/useAutoAdvance.js';
import { useIsNarrow } from '../../hooks/useIsNarrow.js';
import { useIsShort } from '../../hooks/useIsShort.js';
import { useLogger } from '../../hooks/useLog.js';
import { $session } from '../../store.js';
import { useMcpConnect } from './useMcpConnect.js';
import { track } from '@lib/telemetry.js';
import { toolsConnected } from './log-messages.js';
import * as te from './telemetry-events.js';

const STATUS_ICON: Record<McpServerStatus, { icon: string; color: string }> = {
  'not-installed': { icon: Icons.dash, color: Colors.muted },
  installed: { icon: Icons.circle, color: Colors.warning },
  connected: { icon: Icons.check, color: Colors.success },
};

export function ConnectToolsScreen() {
  const log = useLogger(ScreenId.ConnectTools);
  const isShort = useIsShort();
  const isNarrow = useIsNarrow();
  const { phase, serverStatuses, available, connectedNames, connect, skip } = useMcpConnect();

  const isComplete = phase === 'already-connected' || phase === 'connected' || phase === 'skipped';
  const showBullets = !isShort && !isNarrow;

  useAutoAdvance({
    screen: ScreenId.ConnectTools,
    when: isComplete,
    delay: 1500,
    onAdvance() {
      const connected = $session.get().connectedMcps;
      log(toolsConnected(phase as 'already-connected' | 'connected' | 'skipped', connected));
      track(te.connectToolsAdvanced(phase));
    },
  });

  const promptOptions = useMemo(() => {
    const hasConnected = connectedNames.length > 0;
    const remaining = available.filter(
      (s) => (serverStatuses[s.name] ?? 'not-installed') !== 'connected',
    );

    return [
      {
        label: hasConnected ? 'Connect all remaining' : 'Connect all tools',
        value: 'all',
      },
      ...remaining.map((s) => ({ label: `Connect ${s.name}`, value: s.name })),
      {
        label: hasConnected ? 'Done' : 'Skip for now',
        value: 'skip',
      },
    ];
  }, [available, serverStatuses, connectedNames]);

  const tasks = buildWizardTasks('connectTools', isComplete ? 'done' : 'active');

  const left = (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={Colors.primary} bold>
          Connect your AI to Confidence
        </Text>
      </Box>
      <Box marginBottom={1} flexDirection="column">
        <Text color={Colors.muted}>
          Give your AI assistant direct access to flags, docs, and integration tools. With it,
          you'll be able to:
        </Text>
        {showBullets && (
          <>
            <Box marginTop={1}>
              <Box width={2} flexShrink={0}>
                <Text color={Colors.muted}>{Icons.bullet}</Text>
              </Box>
              <Text>Ask your agent to create and manage feature flags.</Text>
            </Box>
            <Box>
              <Box width={2} flexShrink={0}>
                <Text color={Colors.muted}>{Icons.bullet}</Text>
              </Box>
              <Text>Search docs and generate code, all from your IDE.</Text>
            </Box>
            <Box>
              <Box width={2} flexShrink={0}>
                <Text color={Colors.muted}>{Icons.bullet}</Text>
              </Box>
              <Text>Avoid context-switching or manual lookups. Your assistant has the keys.</Text>
            </Box>
          </>
        )}
      </Box>

      {phase === 'detecting' && <Spinner label="Checking Confidence tools..." />}

      {phase !== 'detecting' && (
        <Box flexDirection="column" marginBottom={1}>
          <Text>Confidence tools:</Text>
          {available.map((server) => {
            const status = serverStatuses[server.name] ?? 'not-installed';
            const { icon, color } = STATUS_ICON[status];

            return (
              <Box key={server.name}>
                <Box width={2} flexShrink={0}>
                  <Text color={color}>{icon}</Text>
                </Box>
                <Text color={status === 'not-installed' ? Colors.muted : undefined}>
                  {server.name}{' '}
                  {status === 'installed' && (
                    <Text color={Colors.muted}>(installed, not responding)</Text>
                  )}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}

      {(phase === 'already-connected' || phase === 'connected') && (
        <Box marginTop={1}>
          <Text color={Colors.success}>
            {phase === 'already-connected'
              ? 'All tools connected and responding.'
              : 'Connected successfully.'}{' '}
            Continuing...
          </Text>
        </Box>
      )}

      {phase === 'connecting' && <Spinner label="Connecting Confidence tools..." />}

      {phase === 'skipped' && (
        <Box flexDirection="column">
          <Text color={Colors.warning}>
            Skipped — your AI will still work, just without live Confidence access.
          </Text>
          <Box marginTop={1}>
            <Text color={Colors.muted}>
              Connect later: <Text color={Colors.primary}>{CONFIDENCE_DOCS_URL}</Text>
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <TwoColumnLayout left={left} right={<TaskList tasks={tasks} />} />

      {phase === 'ask-install' && (
        <PromptPanel
          mode="select"
          status={connectedNames.length > 0 ? 'Connect another tool?' : 'Connect Confidence tools?'}
          options={promptOptions}
          onSelect={(value) => {
            if (value === 'skip') {
              track(te.connectToolsSkipped());
              skip();
            } else {
              track(te.connectToolsSelected(value));
              connect(value);
            }
          }}
        />
      )}
    </Box>
  );
}
