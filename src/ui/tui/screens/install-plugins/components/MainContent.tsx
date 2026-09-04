import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import type { IdeId } from '@shared-kernel/types.js';
import { getIntegrations } from '@integrations/index.js';
import { PLUGIN_REPO_URL } from '@lib/constants.js';
import { Colors, Icons } from '../../../styles.js';
import type { PluginPhase } from '../usePluginInstall.js';

type IdeLabels = Record<IdeId, string>;

const IDE_LABELS = Object.fromEntries(getIntegrations().map((i) => [i.id, i.name])) as IdeLabels;

type MainContentProps = {
  phase: PluginPhase;
  detected: IdeId[];
  error: string | null;
};

export function MainContent({ phase, detected, error }: MainContentProps) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={Colors.primary} bold>
          Select agent to set up
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={Colors.muted}>
          Your agent will get Confidence skills for flag management, warehouse setup, migrations,
          and onboarding — so it can help without searching the docs.
        </Text>
      </Box>

      {phase === 'choose-ide' && (
        <Box marginBottom={1}>
          <Text color={Colors.warning}>
            {Icons.diamond} For a safer and more controlled experience, we recommend Claude Code.
          </Text>
        </Box>
      )}

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
              You can install manually from: <Text color={Colors.primary}>{PLUGIN_REPO_URL}</Text>
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
