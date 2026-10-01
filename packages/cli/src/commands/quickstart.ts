import { spawn } from '@spotify-confidence/core';

export const quickstartCommand = {
  command: 'quickstart',
  describe: 'Launch the interactive Confidence setup wizard',
  builder: {
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
  },
  async handler(argv: Record<string, unknown>) {
    const args = buildArgs(argv);
    const child = spawn('npx', ['--yes', '@spotify-confidence/quickstart', ...args], {
      stdio: 'inherit',
    });

    await new Promise<void>((resolve) => {
      child.on('close', (code) => {
        if (code !== 0) process.exitCode = code ?? 1;
        resolve();
      });
      child.on('error', (err) => {
        console.error(`Failed to launch quickstart wizard: ${err.message}`);
        process.exitCode = 1;
        resolve();
      });
    });
  },
};

function buildArgs(argv: Record<string, unknown>): string[] {
  const args: string[] = [];
  if (argv['dry-run'] ?? argv.dryRun) args.push('--dry-run');
  if (argv.debug) args.push('--debug');
  if (typeof argv.dir === 'string') args.push('--dir', argv.dir);
  if (argv.telemetry === false) args.push('--no-telemetry');
  const features = argv.features as string[] | undefined;
  if (features?.length) {
    for (const feature of features) {
      args.push('--features', feature);
    }
  }
  return args;
}
