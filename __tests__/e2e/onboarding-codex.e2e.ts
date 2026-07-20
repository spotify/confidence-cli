import {
  createSession,
  navigateToPlugins,
  selectIdeAndOnboard,
  readInvocation,
} from './helpers/index.js';

describe('Codex onboarding invocation', () => {
  it('spawns codex exec with --json, full-access sandbox, and the onboarding prompt via stdin', async () => {
    using session = createSession();

    await navigateToPlugins(session);
    await selectIdeAndOnboard(session, 2);

    const invocation = readInvocation(session.cwd);

    expect(invocation.command).toBe('codex');
    expect(invocation.args).toContain('exec');
    expect(invocation.args).toContain('--json');
    expect(invocation.args).toContain('--sandbox');
    expect(invocation.args).toContain('danger-full-access');
    expect(invocation.args).toContain('-');
    expect(invocation.prompt).toContain('Confidence SDK');
    expect(invocation.prompt).toContain('React');
    expect(invocation.prompt).toContain(session.cwd);
    expect(invocation.prompt).toContain('confidence-flags:');
  });
});
