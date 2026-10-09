import { createProjectDir } from '@spotify-confidence/testing/scaffold';
import { launchChatSession } from '@integrations/chat.js';
import { createSession } from '../../src/session/session.js';
import { createMockIntegration } from './mock-integration.js';

const mockIntegration = createMockIntegration();

vi.mock('../../src/integrations/registry.js', () => ({
  getIntegration: () => mockIntegration,
}));

function capturedPrompt(): string {
  return vi.mocked(mockIntegration.launchChat).mock.calls[0][0].systemPrompt ?? '';
}

describe('launchChatSession', () => {
  it('asks to integrate when no code changes were made', () => {
    using project = createProjectDir('empty');
    const session = createSession({ dir: project.path });

    launchChatSession(session, 'claude');

    expect(capturedPrompt()).toContain("I'd like to integrate Confidence");
  });

  it('summarises code changes when present', () => {
    using project = createProjectDir('empty');
    const session = createSession({ dir: project.path });
    session.codeChanges = ['Added @spotify-confidence/sdk', 'Created confidence.config.ts'];

    launchChatSession(session, 'claude');

    const sut = capturedPrompt();
    expect(sut).toContain('Added @spotify-confidence/sdk');
    expect(sut).toContain('Created confidence.config.ts');
  });

  it('includes report file path when available', () => {
    using project = createProjectDir('empty');
    const session = createSession({ dir: project.path });
    session.codeChanges = ['change'];
    session.reportFile = 'CONFIDENCE_QUICKSTART.md';

    launchChatSession(session, 'claude');

    expect(capturedPrompt()).toContain('CONFIDENCE_QUICKSTART.md');
  });

  it('warns about missing MCP tools when none connected', () => {
    using project = createProjectDir('empty');
    const session = createSession({ dir: project.path });

    launchChatSession(session, 'claude');

    expect(capturedPrompt()).toContain("don't have Confidence MCP tools connected");
  });

  it('does not warn about MCP tools when connected', () => {
    using project = createProjectDir('empty');
    const session = createSession({ dir: project.path });
    session.connectedMcps = ['confidence-flags'];

    launchChatSession(session, 'claude');

    expect(capturedPrompt()).not.toContain("don't have Confidence MCP tools connected");
  });

  it.each([
    'analyze-project',
    'explore-metric',
    'instrument-events',
    'onboard-confidence',
    'onboard-confidence-dry-run',
    'setup-session-recording',
    'setup-warehouse',
    'setup-warehouse-bigquery',
    'setup-warehouse-databricks',
    'setup-warehouse-redshift',
    'setup-warehouse-snowflake',
    'migrate-eppo',
    'migrate-optimizely',
    'migrate-posthog',
    'migrate-statsig',
  ])('includes /confidence:%s skill when plugin is installed', (skill) => {
    using project = createProjectDir('empty');
    const session = createSession({ dir: project.path });
    session.codeChanges = ['change'];
    session.pluginTargets = ['claude'];

    launchChatSession(session, 'claude');

    expect(capturedPrompt()).toContain(`/confidence:${skill}`);
  });

  it('formats skill invocations for the target IDE', () => {
    using project = createProjectDir('empty');
    const session = createSession({ dir: project.path });
    session.codeChanges = ['change'];
    session.pluginTargets = ['cursor'];

    launchChatSession(session, 'cursor');

    const sut = capturedPrompt();
    expect(sut).toContain('/setup-warehouse');
    expect(sut).not.toContain('confidence:');
  });

  it('does not mention skills when no plugin is installed', () => {
    using project = createProjectDir('empty');
    const session = createSession({ dir: project.path });
    session.codeChanges = ['change'];

    launchChatSession(session, 'claude');

    expect(capturedPrompt()).not.toContain('Confidence AI plugin');
  });

  it('passes project dir and auth token to the integration', () => {
    using project = createProjectDir('empty');
    const session = createSession({ dir: project.path });
    session.authState = { status: 'authenticated', token: 'tok_123' };

    launchChatSession(session, 'claude');

    expect(mockIntegration.launchChat).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: project.path, token: 'tok_123' }),
    );
  });
});
