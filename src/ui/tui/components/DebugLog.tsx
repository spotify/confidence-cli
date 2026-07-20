import { Box, Static, Text } from 'ink';
import { ScreenId, type DebugEntry } from '@lib/session.js';
import { useSession } from '../store.js';
import { Colors } from '../styles.js';

const SCREEN_LABELS: Record<ScreenId, string> = {
  [ScreenId.Welcome]: 'Welcome',
  [ScreenId.About]: 'About',
  [ScreenId.SelectFramework]: 'Select Framework',
  [ScreenId.SystemCheck]: 'Check System',
  [ScreenId.InstallPlugins]: 'Install Plugins',
  [ScreenId.Authenticate]: 'Sign In',
  [ScreenId.ConnectTools]: 'Connect Tools',
  [ScreenId.OnboardProject]: 'Onboard Project',
  [ScreenId.Done]: 'Done',
};

function DebugEntryLine({ entry }: { entry: DebugEntry }) {
  return (
    <Box flexDirection="column">
      <Text color={Colors.muted} dimColor>
        {'  '}── {SCREEN_LABELS[entry.screen]} ──
      </Text>
      <Text color={Colors.muted} dimColor>
        {'    '}Input: {entry.input}
      </Text>
      <Text color={Colors.muted} dimColor>
        {'    '}Output: {entry.output}
      </Text>
    </Box>
  );
}

export function DebugLog() {
  const { debug, debugLog } = useSession();

  if (!debug) return null;

  return (
    <Static items={debugLog}>
      {(entry, index) => <DebugEntryLine key={index} entry={entry} />}
    </Static>
  );
}
