import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { Colors, Emoji, Icons } from '../../../styles.js';
import { StatusFeed } from '../../../components/StatusFeed.js';
import { TipCard } from '../../../components/TipCard.js';
import type { OnboardingGoal } from '@lib/session.js';
import type { OnboardingPhase } from '../useOnboardingProcess.js';
import type { StatusLine } from '../../../lib/status-line.js';
import type { Tip } from '../../../lib/tips.js';

export const MAX_VISIBLE_STATUS = 3;

const SANDBOX_WARNING = 'The AI agent will be able to read and write files in your project.';

type OnboardingLeftPanelProps = {
  phase: OnboardingPhase;
  statusLines: StatusLine[];
  error: string | null;
  goal: OnboardingGoal;
  showTips: boolean;
  tip: Tip;
};

export function OnboardingLeftPanel({
  phase,
  statusLines,
  error,
  goal,
  showTips,
  tip,
}: OnboardingLeftPanelProps) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={Colors.primary} bold>
          {phase === 'confirm' ? 'Ready to start?' : 'Setting up your project'}
        </Text>
      </Box>

      {phase === 'confirm' && (
        <>
          <Box flexDirection="column" marginBottom={1}>
            <Text color={Colors.muted}>The wizard will:</Text>
            {onboardingSteps(goal).map((step) => (
              <Text key={step} color={Colors.muted}>
                {Icons.check} {step}
              </Text>
            ))}
          </Box>
          <Box marginBottom={1}>
            <Text color={Colors.warning}>
              {Icons.diamond} {SANDBOX_WARNING}
            </Text>
          </Box>
        </>
      )}

      {phase === 'detecting' && <Spinner label="Detecting project framework..." />}

      {phase === 'choose-sdk' && (
        <Box marginBottom={1} gap={1}>
          <Text color={Colors.warning}>{Icons.cross}</Text>
          <Text>Project appears to be empty. Choose an SDK to generate a sample app</Text>
        </Box>
      )}

      <StatusFeed lines={statusLines} maxVisible={MAX_VISIBLE_STATUS} />

      {phase === 'onboarding' && (
        <Box flexDirection="column" marginTop={1}>
          <Spinner label={`Working... Grab a coffee in the meantime ${Emoji.coffee}`} />
          {showTips && (
            <Box marginTop={1} flexDirection="column">
              <Text>While you wait, here's a tip:</Text>
              <TipCard tip={tip} />
            </Box>
          )}
        </Box>
      )}

      {phase === 'error' && error && (
        <Box marginTop={1}>
          <Text color={Colors.error}>{error}</Text>
        </Box>
      )}
    </Box>
  );
}

const GOAL_STEPS: Record<OnboardingGoal, string[]> = {
  'feature-flags': ['create your first feature flag'],
  'session-recordings': ['set up session recordings to capture user sessions'],
  'event-tracking': ['instrument event tracking to measure user behavior'],
  all: [
    'set up feature flags',
    'set up session recordings to capture user sessions',
    'instrument event tracking to measure user behavior',
  ],
};

function onboardingSteps(goal: OnboardingGoal): string[] {
  return ['add the Confidence SDK', ...GOAL_STEPS[goal]];
}
