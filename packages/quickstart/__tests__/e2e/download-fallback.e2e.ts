import {
  createSession,
  navigateToPlugins,
  selectIdeAndOnboard,
  readInvocation,
} from './testing-framework/index.js';

describe('when CLI plugin install fails', () => {
  it('falls back to download and references skills by file path in the prompt', async () => {
    using session = createSession({ env: { E2E_PLUGIN_INSTALL_FAIL: '1' } });

    await navigateToPlugins(session);
    await selectIdeAndOnboard(session, 0);

    const invocation = readInvocation(session.cwd);

    expect(invocation.prompt).toContain('.claude/skills/analyze-project/SKILL.md');
    expect(invocation.prompt).not.toContain('`/analyze-project`');
  });
});
