import { buildOnboardingPrompt } from '@features/onboarding/index.js';

describe('buildOnboardingPrompt', () => {
  const baseOpts = {
    framework: 'react',
    projectDir: '/project',
    ide: 'claude' as const,
    goals: ['feature-flags' as const],
  };

  describe('skill references', () => {
    it('references analyze-project skill as an absolute file path', () => {
      const sut = buildOnboardingPrompt(baseOpts);

      expect(sut).toContain('.config/confidence/skills/analyze-project/SKILL.md');
      expect(sut).toContain('as a **methodology reference**');
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

    it('references instrument-events skill as an absolute file path', () => {
      const sut = buildOnboardingPrompt(eventOpts);

      expect(sut).toContain('.config/confidence/skills/instrument-events/SKILL.md');
      expect(sut).toContain('as a **methodology reference**');
    });
  });

  describe('session recordings skill reference', () => {
    const recordingOpts = {
      ...baseOpts,
      goals: ['session-recordings' as const],
    };

    it('references setup-session-recording skill as an absolute file path', () => {
      const sut = buildOnboardingPrompt(recordingOpts);

      expect(sut).toContain('.config/confidence/skills/setup-session-recording/SKILL.md');
      expect(sut).toContain('as a **methodology reference**');
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
