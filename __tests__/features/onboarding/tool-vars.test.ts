import { skillInvocation, referenceInstruction } from '@features/onboarding/tool-vars.js';
import type { IdeId } from '@shared-kernel/types.js';

describe('skillInvocation', () => {
  it.each<{ ide: IdeId; expected: string }>([
    { ide: 'claude', expected: '/confidence:analyze-project' },
    { ide: 'codex', expected: '$analyze-project' },
    { ide: 'cursor', expected: '/analyze-project' },
  ])('returns $expected for $ide', ({ ide, expected }) => {
    const sut = skillInvocation('analyze-project', ide);
    expect(sut).toBe(expected);
  });
});

describe('referenceInstruction', () => {
  describe('when method is cli', () => {
    it.each<{ ide: IdeId; expected: string }>([
      {
        ide: 'claude',
        expected: 'Invoke the `/confidence:analyze-project` skill as a **methodology reference**',
      },
      {
        ide: 'codex',
        expected: 'Invoke the `$analyze-project` skill as a **methodology reference**',
      },
      {
        ide: 'cursor',
        expected: 'Invoke the `/analyze-project` skill as a **methodology reference**',
      },
    ])('produces IDE-specific invocation for $ide', ({ ide, expected }) => {
      const sut = referenceInstruction('analyze-project', ide, 'cli');
      expect(sut).toBe(expected);
    });
  });

  describe('when method is download', () => {
    it.each<{ ide: IdeId; expected: string }>([
      {
        ide: 'claude',
        expected: 'Read `.claude/skills/analyze-project/SKILL.md` as a **methodology reference**',
      },
      {
        ide: 'codex',
        expected: 'Read `.agents/skills/analyze-project/SKILL.md` as a **methodology reference**',
      },
      {
        ide: 'cursor',
        expected: 'Read `.cursor/skills/analyze-project/SKILL.md` as a **methodology reference**',
      },
    ])('produces file path for $ide', ({ ide, expected }) => {
      const sut = referenceInstruction('analyze-project', ide, 'download');
      expect(sut).toBe(expected);
    });
  });

  describe('when method is null or undefined', () => {
    it('falls back to file path', () => {
      const sut = referenceInstruction('analyze-project', 'claude', null);
      expect(sut).toContain('Read `.claude/skills/analyze-project/SKILL.md`');
    });

    it('falls back to file path when omitted', () => {
      const sut = referenceInstruction('analyze-project', 'claude');
      expect(sut).toContain('Read `.claude/skills/analyze-project/SKILL.md`');
    });
  });
});
