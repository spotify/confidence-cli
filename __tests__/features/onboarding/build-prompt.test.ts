import { basename, resolve } from 'node:path';
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

    it('asks the summary to list Confidence resources next to file changes', () => {
      const sut = buildOnboardingPrompt(baseOpts);

      expect(sut).toContain('List the resources you created in Confidence as well');
      expect(sut).toContain('not only files and packages');
      expect(sut).toContain('use that wording so the same change is not listed twice');
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

    it('names the client and policy after the resolved project dir, not the framework', () => {
      const sut = buildOnboardingPrompt({ ...recordingOpts, projectDir: '/tmp/checkout-web' });

      expect(sut).toContain('with the display name "checkout-web"');
      expect(sut).toContain('with `displayName` "checkout-web Session Recording"');
      expect(sut).toContain('never after the framework');
      expect(sut).not.toContain('react Session Recording');
    });

    it('resolves --dir . so the client is not named "."', () => {
      const sut = buildOnboardingPrompt({ ...recordingOpts, projectDir: '.' });
      const name = basename(resolve('.'));

      expect(sut).toContain(`with the display name "${name}"`);
      expect(sut).not.toContain('with the display name "."');
    });

    it('does not reuse a colliding client from another project', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('Do not reuse a client solely because its display name already exists');
      expect(sut).toContain(
        'unless the colliding client is the one created earlier in this same run',
      );
      expect(sut).toContain(
        'Never call `mcp__confidence-flags__getClientSecret` for a colliding client',
      );
      expect(sut).not.toContain(
        'If the tool says that display name already exists, keep the resource name',
      );
    });

    it('refers to targeting key and policy by name instead of numbered steps', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('from the **Targeting key** item in');
      expect(sut).toContain('the resource name from the **Policy** item in');
      expect(sut).not.toContain('from step 2');
      expect(sut).not.toContain('from step 3');
    });

    it('uses the framework public env var so the browser can read the client secret', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('VITE_CONFIDENCE_CLIENT_SECRET');
      expect(sut).toContain('NEXT_PUBLIC_CONFIDENCE_CLIENT_SECRET');
      expect(sut).toContain('REACT_APP_CONFIDENCE_CLIENT_SECRET');
      expect(sut).toContain('import.meta.env.VITE_CONFIDENCE_CLIENT_SECRET');
      expect(sut).toContain('fill `<CLIENT_SECRET_ENV>`');
    });

    it('gates recording behind an existing consent tool when one is found', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('OneTrust, Cookiebot, Usercentrics, Didomi');
      expect(sut).toContain("`mode: 'manual'`");
      expect(sut).toContain('only after analytics or recording consent is granted');
      expect(sut).toContain('Fill `<RECORDING_CONSENT_STATUS>`');
    });

    it('tells the agent what recording-rule status to write for each path', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('Fill `<RECORDING_RULE_STATUS>` with "No recording rule was created');
      expect(sut).toContain('Fill `<RECORDING_RULE_STATUS>` with "The recording rule is enabled');
      expect(sut).toContain(
        'Fill `<RECORDING_RULE_STATUS>` with "The existing recording rule records nobody',
      );
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

      expect(sut).toContain('write the Frontend client secret to `.env` under that exact name');
      expect(sut).toContain('Ensure `.env` is in `.gitignore`');
      expect(sut).toContain(
        'never echo the secret in STATUS lines, the report, or generated source',
      );
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
