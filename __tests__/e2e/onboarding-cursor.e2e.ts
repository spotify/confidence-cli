import {
  createSession,
  navigateToPlugins,
  selectIdeAndOnboard,
  readInvocation,
} from './helpers/index.js';

describe('Cursor onboarding invocation', () => {
  it('spawns cursor agent with --print, stream-json format, --approve-mcps, --yolo, and the onboarding prompt', async () => {
    using session = createSession();

    await navigateToPlugins(session);
    await selectIdeAndOnboard(session, 1);

    const invocation = readInvocation(session.cwd);

    expect(invocation.command).toBe('cursor');
    expect(invocation.args[0]).toBe('agent');
    expect(invocation.args).toContain('--print');
    expect(invocation.args).toContain('--output-format');
    expect(invocation.args).toContain('stream-json');
    expect(invocation.args).toContain('--approve-mcps');
    expect(invocation.args).toContain('--yolo');
    expect(invocation.prompt).toContain('Confidence SDK');
    expect(invocation.prompt).toContain('React');
    expect(invocation.prompt).toContain(session.cwd);
    expect(invocation.prompt).toContain('mcp__confidence-flags__');
  });
});
