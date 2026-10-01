import { extractVersion, isAtLeast } from '@integrations/version.js';

describe('extractVersion', () => {
  it('extracts semver from plain version string', () => {
    const sut = extractVersion('2.1.212');
    expect(sut).toEqual([2, 1, 212]);
  });

  it('extracts version from Claude CLI output', () => {
    const sut = extractVersion('2.1.212 (Claude Code)');
    expect(sut).toEqual([2, 1, 212]);
  });

  it('extracts version from Codex CLI output', () => {
    const sut = extractVersion('codex-cli 0.146.0');
    expect(sut).toEqual([0, 146, 0]);
  });

  it('extracts version from Cursor CLI output', () => {
    const sut = extractVersion('3.19.7');
    expect(sut).toEqual([3, 19, 7]);
  });

  it('returns null for string without a version', () => {
    const sut = extractVersion('no version here');
    expect(sut).toBeNull();
  });

  it('returns null for empty string', () => {
    const sut = extractVersion('');
    expect(sut).toBeNull();
  });
});

describe('isAtLeast', () => {
  it('returns true when versions are equal', () => {
    const sut = isAtLeast([2, 1, 212], [2, 1, 212]);
    expect(sut).toBe(true);
  });

  it('returns true when major is higher', () => {
    const sut = isAtLeast([3, 0, 0], [2, 1, 212]);
    expect(sut).toBe(true);
  });

  it('returns true when minor is higher', () => {
    const sut = isAtLeast([2, 2, 0], [2, 1, 212]);
    expect(sut).toBe(true);
  });

  it('returns true when patch is higher', () => {
    const sut = isAtLeast([2, 1, 213], [2, 1, 212]);
    expect(sut).toBe(true);
  });

  it('returns false when major is lower', () => {
    const sut = isAtLeast([1, 9, 999], [2, 1, 212]);
    expect(sut).toBe(false);
  });

  it('returns false when minor is lower', () => {
    const sut = isAtLeast([2, 0, 999], [2, 1, 212]);
    expect(sut).toBe(false);
  });

  it('returns false when patch is lower', () => {
    const sut = isAtLeast([2, 1, 211], [2, 1, 212]);
    expect(sut).toBe(false);
  });
});
