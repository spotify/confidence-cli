import {
  extractCodeChanges,
  formatOnboardingError,
  spawnErrorMessage,
} from '@integrations/utils.js';

describe('extractCodeChanges', () => {
  it('keeps only lines describing a change', () => {
    const sut = extractCodeChanges([
      'Analyzing the project structure',
      'Created confidence.config.ts',
      'Added @spotify-confidence/sdk',
      'Modified src/main.tsx',
    ]);

    expect(sut).toEqual([
      'Created confidence.config.ts',
      'Added @spotify-confidence/sdk',
      'Modified src/main.tsx',
    ]);
  });

  it('reports a change once when the agent repeats its summary', () => {
    const sut = extractCodeChanges([
      'Created confidence.config.ts',
      'Added @spotify-confidence/sdk',
      'Created confidence.config.ts',
      'Added @spotify-confidence/sdk',
    ]);

    expect(sut).toEqual(['Created confidence.config.ts', 'Added @spotify-confidence/sdk']);
  });

  it('ignores status lines already shown as progress', () => {
    const sut = extractCodeChanges(['STATUS: Created recording policy: my-app']);
    expect(sut).toEqual([]);
  });

  it('strips list markers and markdown emphasis', () => {
    const sut = extractCodeChanges(['- **Created** `confidence.config.ts`']);
    expect(sut).toEqual(['Created confidence.config.ts']);
  });

  it('keeps checkmark-prefixed change lines', () => {
    const sut = extractCodeChanges(['✓ Created recording policy with targeting key']);
    expect(sut).toEqual(['Created recording policy with targeting key']);
  });

  it('drops change lines wrapped in other prefixes', () => {
    const sut = extractCodeChanges(['> Created foo']);
    expect(sut).toEqual([]);
  });

  it('ignores prose that merely mentions a change verb', () => {
    const sut = extractCodeChanges(['I have Created the config for you']);
    expect(sut).toEqual([]);
  });

  it('truncates long descriptions', () => {
    const sut = extractCodeChanges([`Created ${'a'.repeat(80)}`]);

    expect(sut[0]).toHaveLength(60);
    expect(sut[0]).toMatch(/…$/);
  });
});

describe('spawnErrorMessage', () => {
  it('returns a helpful message for ENOENT', () => {
    const sut = spawnErrorMessage('codex', Object.assign(new Error('fail'), { code: 'ENOENT' }));
    expect(sut).toContain('not found or not executable');
  });

  it('returns the raw message for other errors', () => {
    const sut = spawnErrorMessage('codex', Object.assign(new Error('boom'), { code: 'UNKNOWN' }));
    expect(sut).toBe('boom');
  });
});

describe('formatOnboardingError', () => {
  it('includes the CLI name and exit code in the headline', () => {
    const sut = formatOnboardingError('codex', '', 1);

    expect(sut).toContain('codex');
    expect(sut).toContain('code 1');
  });

  it('returns only the headline when stderr is empty', () => {
    const sut = formatOnboardingError('claude', '', 1);

    expect(sut).not.toContain('\n\n');
    expect(sut).toContain('claude exited with an error');
  });

  it('appends stderr detail below the headline', () => {
    const sut = formatOnboardingError('cursor', 'something went wrong', 2);

    const [headline, , detail] = sut.split('\n');
    expect(headline).toContain('cursor exited with an error');
    expect(detail).toBe('something went wrong');
  });

  it('truncates stderr beyond 5 lines', () => {
    const lines = Array.from({ length: 8 }, (_, i) => `line ${i + 1}`);
    const sut = formatOnboardingError('codex', lines.join('\n'), 1);

    expect(sut).toContain('line 5');
    expect(sut).not.toContain('line 6');
    expect(sut).toContain('... (3 more lines)');
  });

  it('does not show overflow hint when stderr is within the limit', () => {
    const sut = formatOnboardingError('codex', 'one\ntwo\nthree', 1);

    expect(sut).not.toContain('more lines');
  });

  it('omits exit code when code is null', () => {
    const sut = formatOnboardingError('claude', '', null);

    expect(sut).toContain('exited with an error.');
    expect(sut).not.toContain('(code');
  });
});
