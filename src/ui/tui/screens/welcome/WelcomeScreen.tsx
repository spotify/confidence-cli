import { Box, Text } from 'ink';
import { Colors, HAlign, Icons, VAlign } from '../../styles.js';
import { PromptPanel } from '../../components/PromptPanel.js';
import { SDK_OPTIONS } from '@lib/sdk-options.js';
import { ScreenId } from '@lib/session.js';
import { useLogger } from '../../hooks/useLog.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { useFrameworkDetection } from '../../hooks/useFrameworkDetection.js';
import { useIsNarrow } from '../../hooks/useIsNarrow.js';
import { useIsShort } from '../../hooks/useIsShort.js';
import { useSession } from '../../store.js';
import { track, isTelemetryEnabled } from '@lib/telemetry.js';
import { welcomeMenuSelect } from './log-messages.js';
import { welcomeMenuSelected } from './telemetry-events.js';

const STEPS = [
  'Check your system',
  'Teach your AI Confidence',
  'Sign in to Confidence',
  'Connect your AI to Confidence',
  'Integrate the SDK into your project',
  'Show a working feature flag example',
] as const;

const MENU_OPTIONS = [
  { label: 'Start setup', value: 'start' },
  { label: 'Change framework', value: 'framework' },
  { label: 'About Confidence', value: 'about' },
  { label: 'Quit', value: 'quit' },
] as const;

const MENU_OPTIONS_NO_FRAMEWORK = [
  { label: 'Select framework', value: 'framework' },
  { label: 'About Confidence', value: 'about' },
  { label: 'Quit', value: 'quit' },
] as const;

export function WelcomeScreen() {
  const session = useSession();
  const navigate = useNavigation(ScreenId.Welcome);
  const log = useLogger(ScreenId.Welcome);
  const detectionAttempted = useFrameworkDetection();
  const dir = session.projectDir;

  const frameworkId = session.framework;
  const frameworkSource = session.frameworkSource;
  const frameworkLabel = frameworkId
    ? (SDK_OPTIONS.find((s) => s.id === frameworkId)?.label ?? frameworkId)
    : null;

  const narrow = useIsNarrow();
  const short = useIsShort();
  const showSteps = !short;
  const align = narrow ? HAlign.Left : HAlign.Center;

  const telemetryOn = isTelemetryEnabled();
  const frameworkIcon = frameworkLabel ? Icons.check : Icons.cross;
  const frameworkColor = frameworkLabel ? Colors.success : Colors.warning;
  const frameworkUnknown = detectionAttempted && frameworkLabel === null;
  const menuOptions = frameworkUnknown ? MENU_OPTIONS_NO_FRAMEWORK : MENU_OPTIONS;

  function handleMenuSelect(value: string) {
    log(
      welcomeMenuSelect({
        label: menuOptions.find((o) => o.value === value)?.label ?? value,
        dir,
        framework: frameworkLabel,
        source: frameworkSource,
      }),
    );

    track(welcomeMenuSelected(value));

    if (value === 'start') navigate.to('start');
    else if (value === 'framework') navigate.to('framework');
    else if (value === 'about') navigate.to('about');
    else if (value === 'quit') process.exit(0);
  }

  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="space-between">
      <Box flexDirection="column" alignItems={align} flexGrow={1} justifyContent={VAlign.Center}>
        <Box marginBottom={1}>
          <Text color={Colors.primary} bold>
            Confidence Quickstart
          </Text>
        </Box>

        <Box marginBottom={1} flexDirection="column" alignItems={align}>
          <Text>Feature flags and experiments, set up with AI in minutes.</Text>
        </Box>

        {showSteps && (
          <Box marginBottom={1} flexDirection="column" alignItems={align}>
            <Text>This wizard will:</Text>
            {STEPS.map((step, i) => (
              <Text key={step}>{` ${i + 1}. ${step}`}</Text>
            ))}
          </Box>
        )}

        <Box flexDirection="column" marginTop={1}>
          <Text>
            <Text color={Colors.muted}>{'    Directory  '}</Text>
            <Text color={Colors.success}>{Icons.check}</Text>
            <Text> {dir}</Text>
          </Text>
          <Text>
            <Text color={Colors.muted}>{'    Framework  '}</Text>
            {detectionAttempted ? (
              <>
                <Text color={frameworkColor}>{frameworkIcon}</Text>
                <Text> {frameworkLabel ?? 'Could not auto-detect'}</Text>
                {frameworkSource && <Text color={Colors.muted}> ({frameworkSource})</Text>}
              </>
            ) : (
              <Text color={Colors.muted}>detecting...</Text>
            )}
          </Text>
          <Text>
            <Text color={Colors.muted}>{'    Telemetry  '}</Text>
            {telemetryOn ? (
              <>
                <Text color={Colors.success}>{Icons.check}</Text>
                <Text color={Colors.muted}>
                  {' on · to opt out, use CONFIDENCE_TELEMETRY=false'}
                </Text>
              </>
            ) : (
              <>
                <Text color={Colors.muted}>{Icons.cross}</Text>
                <Text color={Colors.muted}>{' off'}</Text>
              </>
            )}
          </Text>
        </Box>
      </Box>

      <PromptPanel
        mode="select"
        status={frameworkUnknown ? 'Please, select your framework' : 'Ready to get started?'}
        options={menuOptions.map(({ label, value }) => ({ label, value }))}
        onSelect={handleMenuSelect}
      />
    </Box>
  );
}
