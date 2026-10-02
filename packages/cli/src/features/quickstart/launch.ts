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
    choices: ['none', 'flags', 'events', 'recordings'] as const,
    describe: 'Pre-select onboarding features (use "none" for SDK-only setup)',
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

  if (noTelemetry) {
    process.env.CONFIDENCE_TELEMETRY = 'false';
  }

  const { startTui, resolveGoals } = await import('@spotify-confidence/quickstart');
  await startTui({ dryRun, debug, dir, goals: resolveGoals(features) });
}
