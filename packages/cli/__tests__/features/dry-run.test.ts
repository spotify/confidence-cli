import { isDryRun, dryRunGuard } from '@utils/index.js';
import { captureOutput } from '../helpers/capture.js';

describe('isDryRun', () => {
  it('returns true when dry-run is set', () => {
    expect(isDryRun({ 'dry-run': true })).toBe(true);
  });

  it('returns false when dry-run is absent', () => {
    expect(isDryRun({})).toBe(false);
  });

  it('returns false when dry-run is false', () => {
    expect(isDryRun({ 'dry-run': false })).toBe(false);
  });
});

describe('dryRunGuard', () => {
  it('prints payload as JSON and returns true when dry-run is active', () => {
    using output = captureOutput();

    const sut = dryRunGuard({ 'dry-run': true }, { flagKey: 'dark-mode', enabled: true });

    expect(sut).toBe(true);
    const parsed = JSON.parse(output.stdout);
    expect(parsed).toEqual({ flagKey: 'dark-mode', enabled: true });
  });

  it('returns false and writes nothing when dry-run is not active', () => {
    using output = captureOutput();

    const sut = dryRunGuard({ 'dry-run': false }, { flagKey: 'dark-mode' });

    expect(sut).toBe(false);
    expect(output.stdout).toBe('');
  });
});
