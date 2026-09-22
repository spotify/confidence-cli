import { buildOnboardingPrompt } from '@features/onboarding/index.js';

describe('buildOnboardingPrompt', () => {
  const baseOpts = {
    framework: 'react',
    projectDir: '/project',
    ide: 'claude' as const,
    goals: ['feature-flags' as const],
  };

  describe('when plugins are installed via CLI', () => {
    it('references analyze-project skill with plugin namespace for claude', () => {
      const sut = buildOnboardingPrompt({
        ...baseOpts,
        pluginInstallMethod: 'cli',
      });

      expect(sut).toContain(
        'Invoke the `/confidence:analyze-project` skill as a **methodology reference**',
      );
      expect(sut).not.toContain('Read `.claude/skills/analyze-project/SKILL.md`');
    });
  });

  describe('when plugins are installed via download', () => {
    it('references analyze-project skill as a file path', () => {
      const sut = buildOnboardingPrompt({
        ...baseOpts,
        pluginInstallMethod: 'download',
      });

      expect(sut).toContain(
        'Read `.claude/skills/analyze-project/SKILL.md` as a **methodology reference**',
      );
      expect(sut).not.toContain('Invoke the `/analyze-project`');
    });
  });

  describe('when pluginInstallMethod is null', () => {
    it('defaults to file path references', () => {
      const sut = buildOnboardingPrompt({
        ...baseOpts,
        pluginInstallMethod: null,
      });

      expect(sut).toContain('Read `.claude/skills/analyze-project/SKILL.md`');
    });

    it('requires a persisted identity for feature flag evaluation', () => {
      const sut = buildOnboardingPrompt(baseOpts);

      expect(sut).toContain("first entity field from the client's context schema");
      expect(sut).toContain('`localStorage` only in a browser entrypoint');
      expect(sut).toContain("don't fabricate them or mint a new ID per page load");
    });
  });

  describe('event tracking skill reference', () => {
    const eventOpts = {
      ...baseOpts,
      goals: ['feature-flags' as const, 'event-tracking' as const],
    };

    it('uses namespaced slash command when installed via CLI', () => {
      const sut = buildOnboardingPrompt({
        ...eventOpts,
        pluginInstallMethod: 'cli',
      });

      expect(sut).toContain(
        'Invoke the `/confidence:instrument-events` skill as a **methodology reference**',
      );
    });

    it('uses file path when installed via download', () => {
      const sut = buildOnboardingPrompt({
        ...eventOpts,
        pluginInstallMethod: 'download',
      });

      expect(sut).toContain('Read `.claude/skills/instrument-events/SKILL.md`');
    });
  });

  describe('with different IDEs', () => {
    it('uses cursor skills dir for cursor with download method', () => {
      const sut = buildOnboardingPrompt({
        ...baseOpts,
        ide: 'cursor',
        pluginInstallMethod: 'download',
      });

      expect(sut).toContain('Read `.cursor/skills/analyze-project/SKILL.md`');
    });

    it('uses codex skills dir for codex with download method', () => {
      const sut = buildOnboardingPrompt({
        ...baseOpts,
        ide: 'codex',
        pluginInstallMethod: 'download',
      });

      expect(sut).toContain('Read `.agents/skills/analyze-project/SKILL.md`');
    });

    it('uses $ prefix for codex skill invocations via CLI', () => {
      const sut = buildOnboardingPrompt({
        ...baseOpts,
        ide: 'codex',
        pluginInstallMethod: 'cli',
      });

      expect(sut).toContain('Invoke the `$analyze-project` skill as a **methodology reference**');
    });

    it('uses bare slash for cursor skill invocations via CLI', () => {
      const sut = buildOnboardingPrompt({
        ...baseOpts,
        ide: 'cursor',
        pluginInstallMethod: 'cli',
      });

      expect(sut).toContain('Invoke the `/analyze-project` skill as a **methodology reference**');
    });
  });

  describe('session recordings MCP setup', () => {
    const recordingOpts = {
      ...baseOpts,
      goals: ['session-recordings' as const],
    };

    it('instructs the agent to create a recording policy and targeting-key rule', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('mcp__confidence-flags__createRecordingPolicy');
      expect(sut).toContain('mcp__confidence-flags__addRecordingRule');
      expect(sut).toContain('targetingKeySelector');
      expect(sut).toContain('`enabled`: true');
      expect(sut).toContain('STATUS: Setting up recording policy...');
    });

    it('includes Confidence resources in the final change summary', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('Created recording policy with targeting key');
      expect(sut).toContain(
        'Created recording rule (Record all visitors, 100% audience, 100% sessions, enabled)',
      );
    });

    it('instructs the agent to pass a 100% audience instead of sending 0', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('`stableAudiencePercentage`: 100');
      expect(sut).toContain('`sessionSampleRate`: 1');
      expect(sut).toContain('agents often send `0`');
    });

    it('matches recording policies to the client resource name, not display name', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('never reuse a policy because its display name looks similar');
      expect(sut).toContain(
        "Reuse a policy only when its `clients` list contains this client's resource name",
      );
      expect(sut).toContain('pass each non-empty `nextPageToken` back as `pageToken`');
      expect(sut).toContain("`clientName` set to this client's resource name");
      expect(sut).toContain('Keep the returned resource name (`clients/<id>` from `name:`)');
      expect(sut).not.toContain('cannot match an existing policy to a client');
    });

    it('treats goal selection as confirmation to enable recording', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('explicit confirmation to start recording');
      expect(sut).toContain('enable the rule immediately without asking another question');
      expect(sut).toContain('Tell the user afterward that the rule is enabled');
    });

    it('names the client and policy after the project, not the framework', () => {
      const sut = buildOnboardingPrompt({ ...recordingOpts, projectDir: '/tmp/checkout-web' });

      expect(sut).toContain('with the display name "checkout-web"');
      expect(sut).toContain('with `displayName` "checkout-web Session Recording"');
      expect(sut).toContain('never after the framework');
      expect(sut).not.toContain('react Session Recording');
    });

    it('flags a reused rule that has no audience segment', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('STATUS: Existing recording rule records nobody');
      expect(sut).toContain('An audience segment (`segments/<id>`) is the healthy');
      expect(sut).toContain('including rules with no targeting conditions');
      expect(sut).toContain('records nobody and no MCP tool can repair');
    });

    it('keeps the client secret out of output and source', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('Write the secret only to `.env`');
      expect(sut).toContain('ensure `.env` is in `.gitignore`');
      expect(sut).toContain('never echo it in STATUS lines, the report, or generated source');
    });

    it('picks the targeting key from the context schema like flags', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('mcp__confidence-flags__getContextSchema');
      expect(sut).toContain('first available entity field');
      expect(sut).toContain('Do not assume `user_id` or `targeting_key`');
      expect(sut).toContain('`localStorage` only in a browser entrypoint');
      expect(sut).not.toContain("inspect the app's auth/session code");
    });

    it('reuses the feature flag identity when both goals are selected', () => {
      const sut = buildOnboardingPrompt({
        ...recordingOpts,
        goals: ['feature-flags', 'session-recordings'],
      });

      expect(sut).toContain('If feature flags were integrated earlier, reuse that entity field');
      expect(sut).toContain('reuse the flag identity if present');
    });

    it('uses Codex MCP tool names for Codex', () => {
      const sut = buildOnboardingPrompt({ ...recordingOpts, ide: 'codex' });

      expect(sut).toContain('confidence-flags:createRecordingPolicy');
      expect(sut).toContain('confidence-flags:addRecordingRule');
      expect(sut).not.toContain('mcp__confidence-flags__createRecordingPolicy');
    });
  });
});
