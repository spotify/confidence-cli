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
});
