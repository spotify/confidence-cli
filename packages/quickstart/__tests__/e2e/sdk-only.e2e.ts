import {
  createSession,
  navigatePastWelcome,
  navigatePastAuth,
  selectIdeAndOnboard,
  readInvocation,
} from '@spotify-confidence/testing/e2e';

describe('--features none (SDK-only setup)', () => {
  it('skips goal selection screen', async () => {
    using session = createSession({ extraArgs: ['--features', 'none'] });

    await navigatePastWelcome(session);
    await navigatePastAuth(session);

    await session.waitForText('Which CLI agent would you like to use?');
  });

  it('omits "Select features" from the task list', async () => {
    using session = createSession({ extraArgs: ['--features', 'none'] });

    await navigatePastWelcome(session);
    await navigatePastAuth(session);
    await session.waitForText('Which CLI agent would you like to use?');

    expect(session.screen).not.toContain('Select features');
  });

  it('produces an SDK-only onboarding prompt', async () => {
    using session = createSession({ extraArgs: ['--features', 'none'] });

    await navigatePastWelcome(session);
    await navigatePastAuth(session);
    await session.waitForText('Which CLI agent would you like to use?');
    await selectIdeAndOnboard(session, 0);

    const invocation = readInvocation(session.cwd);

    expect(invocation.prompt).toContain('Install the appropriate Confidence SDK');
    expect(invocation.prompt).toContain('searchDocumentation');
    expect(invocation.prompt).toContain('do not configure providers, create flags, or add instrumentation');
  });

  it('does not include feature flag, recording, or event sections in the prompt', async () => {
    using session = createSession({ extraArgs: ['--features', 'none'] });

    await navigatePastWelcome(session);
    await navigatePastAuth(session);
    await session.waitForText('Which CLI agent would you like to use?');
    await selectIdeAndOnboard(session, 0);

    const invocation = readInvocation(session.cwd);

    expect(invocation.prompt).not.toContain('analyze-project');
    expect(invocation.prompt).not.toContain('Session Recording');
    expect(invocation.prompt).not.toContain('instrument-events');
  });
});
