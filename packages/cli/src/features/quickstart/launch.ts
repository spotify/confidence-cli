const FEATURE_TO_GOAL: Record<string, string> = {
  flags: 'feature-flags',
  events: 'event-tracking',
  recordings: 'session-recordings',
};

export const QUICKSTART_BUILDER = {
  dir: {
    type: 'string' as const,
    describe: 'Project directory to run the wizard in',
    normalize: true,
  },
  telemetry: {
    type: 'boolean' as const,
    default: true,
    describe: 'Collect anonymous usage telemetry (disable with --no-telemetry)',
  },
  features: {
    type: 'string' as const,
    array: true,
    choices: ['flags', 'events', 'recordings'] as const,
    describe: 'Pre-select onboarding features',
  },
} as const;

export async function launchQuickstart(
  argv: Record<string, unknown>,
  defaults?: { features?: string[] },
) {
  const dryRun = Boolean(argv['dry-run'] ?? argv.dryRun);
  const debug = Boolean(argv.debug);
  const dir = argv.dir as string | undefined;
  const noTelemetry = argv.telemetry === false;
  const features = (argv.features as string[] | undefined) ?? defaults?.features;
  const goals = features?.map((f) => FEATURE_TO_GOAL[f]).filter(Boolean);

  if (noTelemetry) {
    process.env.CONFIDENCE_TELEMETRY = 'false';
  }

  const { startTui } = await import('@spotify-confidence/quickstart');
  await startTui({ dryRun, debug, dir, goals });
}
