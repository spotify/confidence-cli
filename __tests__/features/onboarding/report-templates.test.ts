import { buildReportTemplate } from '@features/onboarding/report-templates.js';
import type { OnboardingGoal } from '@shared-kernel/types.js';

function fileEntries(goals: OnboardingGoal[]): string[] {
  const { start } = buildReportTemplate(goals);
  const section = start.split('**New/modified files:**')[1]?.split('**New dependencies:**')[0];
  return section
    ? section
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('- '))
    : [];
}

function depEntries(goals: OnboardingGoal[]): string[] {
  const { start } = buildReportTemplate(goals);
  const section = start.split('**New dependencies:**')[1];
  return section
    ? section
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('- '))
    : [];
}

describe('when only feature-flags is selected', () => {
  const goals: OnboardingGoal[] = ['feature-flags'];

  it('includes .env, entry point with SDK initialization, and flag evaluation', () => {
    const sut = fileEntries(goals);

    expect(sut).toEqual([
      '- `<.env file>` — added `CONFIDENCE_CLIENT_SECRET`',
      '- `<entry point file>` — added SDK initialization',
      '- `<aha target file>` — added flag evaluation',
    ]);
  });

  it('lists the feature flags SDK dependency', () => {
    const sut = depEntries(goals);
    expect(sut).toEqual(['- `<feature flags SDK package name>`']);
  });
});

describe('when only session-recordings is selected', () => {
  const goals: OnboardingGoal[] = ['session-recordings'];

  it('includes separate entry point lines for SDK init and session recording', () => {
    const sut = fileEntries(goals);

    expect(sut).toEqual([
      '- `<.env file>` — added `CONFIDENCE_CLIENT_SECRET`',
      '- `<entry point file>` — added SDK initialization',
      '- `<entry point file>` — added session recording provider',
    ]);
  });

  it('lists the session recording SDK dependency', () => {
    const sut = depEntries(goals);
    expect(sut).toEqual(['- `<session recording SDK package name>`']);
  });
});

describe('when only event-tracking is selected', () => {
  const goals: OnboardingGoal[] = ['event-tracking'];

  it('includes .env, entry point, and track() calls without duplicates', () => {
    const sut = fileEntries(goals);

    expect(sut).toEqual([
      '- `<.env file>` — added `CONFIDENCE_CLIENT_SECRET`',
      '- `<entry point file>` — added SDK initialization',
      '- `<files with track() calls>` — added event tracking calls',
    ]);
  });

  it('lists a specific event tracking SDK dependency', () => {
    const sut = depEntries(goals);
    expect(sut).toEqual(['- `<event tracking SDK package name>`']);
  });
});

describe('when all goals are selected', () => {
  const goals: OnboardingGoal[] = ['feature-flags', 'session-recordings', 'event-tracking'];

  it('produces one .env line and no duplicate entry point lines', () => {
    const sut = fileEntries(goals);
    const envLines = sut.filter((l) => l.includes('.env file'));
    const entryPointLines = sut.filter((l) => l.includes('entry point file'));

    expect(envLines).toHaveLength(1);
    expect(entryPointLines).toHaveLength(2);
    expect(entryPointLines[0]).toContain('SDK initialization');
    expect(entryPointLines[1]).toContain('session recording provider');
  });

  it('lists separate entry point lines for SDK init and session recording', () => {
    const sut = fileEntries(goals);
    const entryPointLines = sut.filter((l) => l.includes('entry point file'));

    expect(entryPointLines).toEqual([
      '- `<entry point file>` — added SDK initialization',
      '- `<entry point file>` — added session recording provider',
    ]);
  });

  it('lists all three SDK dependencies', () => {
    const sut = depEntries(goals);
    expect(sut).toHaveLength(3);
  });
});
