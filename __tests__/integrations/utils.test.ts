import { formatOnboardingError, spawnErrorMessage } from '@integrations/utils.js';

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
