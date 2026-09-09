import { defaultCommand } from '@commands/default.js';
import { isTelemetryEnabled, resetTelemetry } from '@lib/telemetry.js';

// Keep the real command and telemetry initialization, without opening a terminal UI.
vi.mock('ink', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ink')>();
  return {
    ...actual,
    render: () => ({ waitUntilExit: () => Promise.resolve() }),
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetTelemetry();
});

describe('when starting the wizard', () => {
  it('honors the telemetry opt-out even when enabled by the environment', async () => {
    vi.stubEnv('CONFIDENCE_TELEMETRY', 'true');
    const sut = defaultCommand;

    await sut.handler({ telemetry: false } as never);

    expect(isTelemetryEnabled()).toBe(false);
  });

  it('preserves the environment opt-out with the default CLI value', async () => {
    vi.stubEnv('CONFIDENCE_TELEMETRY', 'false');
    const sut = defaultCommand;

    await sut.handler({ telemetry: true } as never);

    expect(isTelemetryEnabled()).toBe(false);
  });

  it('preserves enabled telemetry when no opt-out is requested', async () => {
    vi.stubEnv('CONFIDENCE_TELEMETRY', 'true');
    const sut = defaultCommand;

    await sut.handler({ telemetry: true } as never);

    expect(isTelemetryEnabled()).toBe(true);
  });
});
