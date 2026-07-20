import {
  createSession,
  navigateToPlugins,
  selectIdeAndOnboard,
  readInvocation,
} from './helpers/index.js';

describe('Claude Code onboarding invocation', () => {
  it('spawns claude with --print, stream-json format, and the onboarding prompt', async () => {
    using session = createSession();

    await navigateToPlugins(session);
    await selectIdeAndOnboard(session, 0);

    const invocation = readInvocation(session.cwd);

    expect(invocation.command).toBe('claude');
    expect(invocation.args).toContain('--print');
    expect(invocation.args).toContain('--output-format');
    expect(invocation.args).toContain('stream-json');
    expect(invocation.args).toContain('--verbose');
    expect(invocation.prompt).toContain('Confidence SDK');
    expect(invocation.prompt).toContain('React');
    expect(invocation.prompt).toContain(session.cwd);
    expect(invocation.prompt).toContain('mcp__confidence-flags__');
  });
});
