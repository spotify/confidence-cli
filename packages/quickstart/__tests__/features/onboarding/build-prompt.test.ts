import type { OnboardingGoal } from '@spotify-confidence/shared-kernel';
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

  describe('with no goals (SDK-only setup)', () => {
    const sdkOnlyOpts = { ...baseOpts, goals: [] as OnboardingGoal[] };

    it('produces an SDK-only install prompt', () => {
      const sut = buildOnboardingPrompt(sdkOnlyOpts);

      expect(sut).toContain('Install the appropriate Confidence SDK');
      expect(sut).toContain('react');
    });

    it('does not include feature flag, recording, or event tracking sections', () => {
      const sut = buildOnboardingPrompt(sdkOnlyOpts);

      expect(sut).not.toContain('integrateFeatureFlags');
      expect(sut).not.toContain('Session Recording');
      expect(sut).not.toContain('Event Tracking');
    });

    it('instructs the agent to only install the SDK', () => {
      const sut = buildOnboardingPrompt(sdkOnlyOpts);

      expect(sut).toContain('do not configure providers, create flags, or add instrumentation');
    });

    it('references the docs tool for install instructions', () => {
      const sut = buildOnboardingPrompt(sdkOnlyOpts);

      expect(sut).toContain('searchDocumentation');
      expect(sut).toContain('SDK install');
    });
  });

  describe('session recordings skill reference', () => {
    const recordingOpts = {
      ...baseOpts,
      goals: ['session-recordings' as const],
    };

    it('delegates to setup-session-recording skill via CLI when installed via CLI', () => {
      const sut = buildOnboardingPrompt({
        ...recordingOpts,
        pluginInstallMethod: 'cli',
      });

      expect(sut).toContain(
        'Invoke the `/confidence:setup-session-recording` skill as a **methodology reference**',
      );
      expect(sut).not.toContain('Read `.claude/skills/setup-session-recording/SKILL.md`');
    });

    it('delegates to setup-session-recording skill as file path when installed via download', () => {
      const sut = buildOnboardingPrompt({
        ...recordingOpts,
        pluginInstallMethod: 'download',
      });

      expect(sut).toContain(
        'Read `.claude/skills/setup-session-recording/SKILL.md` as a **methodology reference**',
      );
    });

    it('uses cursor skills dir for cursor with download method', () => {
      const sut = buildOnboardingPrompt({
        ...recordingOpts,
        ide: 'cursor',
        pluginInstallMethod: 'download',
      });

      expect(sut).toContain('Read `.cursor/skills/setup-session-recording/SKILL.md`');
    });

    it('uses codex skill invocation for codex with CLI method', () => {
      const sut = buildOnboardingPrompt({
        ...recordingOpts,
        ide: 'codex',
        pluginInstallMethod: 'cli',
      });

      expect(sut).toContain(
        'Invoke the `$setup-session-recording` skill as a **methodology reference**',
      );
    });

    it('overrides skill formatting with STATUS-line-only output', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('Ignore its output formatting entirely');
      expect(sut).toContain('no step tracker, no EDUCATE blocks, no AskUserQuestion calls');
      expect(sut).toContain('STATUS: Setting up session recording...');
    });

    it('produces a single recording step instead of two', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      const recordingHeaders = sut.match(/^## \d+\. .*[Rr]ecord/gm) ?? [];
      expect(recordingHeaders).toHaveLength(1);
      expect(sut).not.toContain('Determine Session Recording SDK');
    });

    it('includes example STATUS lines for all recording phases', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('STATUS: Checking session recording availability...');
      expect(sut).toContain('STATUS: Setting up recording policy...');
      expect(sut).toContain('STATUS: Installing session recording SDK...');
      expect(sut).toContain('STATUS: Adding session recording provider...');
      expect(sut).toContain('STATUS: Configuring privacy and capture settings...');
      expect(sut).toContain('STATUS: Verifying project builds...');
    });

    it('includes guardrails for framework-specific env vars', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('VITE_CONFIDENCE_CLIENT_SECRET');
      expect(sut).toContain('NEXT_PUBLIC_CONFIDENCE_CLIENT_SECRET');
      expect(sut).toContain('REACT_APP_CONFIDENCE_CLIENT_SECRET');
    });

    it('includes guardrails for consent-gated recording', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain("`mode: 'manual'`");
      expect(sut).toContain('only after analytics or recording consent is granted');
    });

    it('includes guardrails for client naming', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('Name clients after the project, never after the framework');
    });

    it('includes guardrails for secret handling', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('`.env`');
      expect(sut).toContain('`.gitignore`');
      expect(sut).toContain(
        'never echo the secret in STATUS lines, the report, or generated source',
      );
    });

    it('tells the agent to fill report placeholders for recording rule and consent status', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('`<RECORDING_RULE_STATUS>`');
      expect(sut).toContain('`<RECORDING_CONSENT_STATUS>`');
    });

    it('correlates sessions with flag evaluations when both goals are selected', () => {
      const sut = buildOnboardingPrompt({
        ...recordingOpts,
        goals: ['feature-flags', 'session-recordings'],
      });

      expect(sut).toContain('same identity field in `context` so sessions correlate');
    });
  });
});
