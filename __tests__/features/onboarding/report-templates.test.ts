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

function usageEntries(goals: OnboardingGoal[]): string[] {
  const { end } = buildReportTemplate(goals);
  const section = end.split('## How to use it')[1]?.split('## Before you merge')[0];
  return section
    ? section
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('- '))
    : [];
}

function checklistEntries(goals: OnboardingGoal[]): string[] {
  const { end } = buildReportTemplate(goals);
  const section = end.split('## Before you merge')[1]?.split('## Next steps')[0];
  return section
    ? section
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('- [ ]'))
    : [];
}

function undoEntries(goals: OnboardingGoal[]): string[] {
  const { end } = buildReportTemplate(goals);
  const section = end.split('## To undo everything')[1]?.split('```')[0];
  return section
    ? section
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('- '))
    : [];
}

function tableRows(goals: OnboardingGoal[]): string[] {
  const { start } = buildReportTemplate(goals);
  const section = start.split('| | |')[1]?.split('## What changed')[0];
  return section
    ? section
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('|') && !l.startsWith('|---'))
    : [];
}

describe('when only feature-flags is selected', () => {
  const goals: OnboardingGoal[] = ['feature-flags'];

  it('includes .env, entry point with SDK initialization, and flag evaluation', () => {
    const sut = fileEntries(goals);

    expect(sut).toEqual([
      '- `<.env file>` — added `<CLIENT_SECRET_ENV>`',
      '- `<entry point file>` — added SDK initialization',
      '- `<aha target file>` — added flag evaluation',
    ]);
  });

  it('lists the feature flags SDK dependency', () => {
    const sut = depEntries(goals);
    expect(sut).toEqual(['- `<feature flags SDK package name>`']);
  });

  it('explains that flags keep their default variant without mentioning recordings', () => {
    const sut = usageEntries(goals).join('\n');

    expect(sut).toContain('default variant');
    expect(sut).not.toContain('recording');
  });
});

describe('when only session-recordings is selected', () => {
  const goals: OnboardingGoal[] = ['session-recordings'];

  it('includes separate entry point lines for SDK init and session recording', () => {
    const sut = fileEntries(goals);

    expect(sut).toEqual([
      '- `<.env file>` — added `<CLIENT_SECRET_ENV>`',
      '- `<entry point file>` — added SDK initialization',
      '- `<entry point file>` — added session recording provider',
    ]);
  });

  it('lists the session recording SDK dependency', () => {
    const sut = depEntries(goals);
    expect(sut).toEqual(['- `<session recording SDK package name>`']);
  });

  it('lists the client, recording policy, and targeting key', () => {
    const sut = tableRows(goals);

    expect(sut).toEqual([
      '| Client | <CLIENT_NAME> |',
      '| Recording policy | <POLICY_NAME> |',
      '| Targeting key | <TARGETING_KEY> |',
    ]);
  });

  it('leaves recording rule and consent status for the agent to fill', () => {
    const sut = usageEntries(goals).join('\n');

    expect(sut).toContain('<RECORDING_RULE_STATUS>');
    expect(sut).toContain('<RECORDING_CONSENT_STATUS>');
    expect(sut).not.toContain('The recording rule is enabled');
    expect(sut).not.toContain('nothing changes');
  });

  it('asks the user to verify captured sessions instead of unchanged behavior', () => {
    const sut = checklistEntries(goals).join('\n');

    expect(sut).toContain('confirm a session appears');
    expect(sut).not.toContain('default behavior is unchanged');
  });

  it('asks the user to cover privacy, consent, and production sampling', () => {
    const sut = checklistEntries(goals).join('\n');

    expect(sut).toContain('Mention session recording in your privacy policy');
    expect(sut).toContain('gate it behind user consent where required');
    expect(sut).toContain("Lower the rule's session sample rate");
    expect(sut).toContain('before rolling out to production traffic');
  });

  it('describes the recorder context rather than only flag evaluation', () => {
    const sut = checklistEntries(goals).join('\n');

    expect(sut).toContain('flag evaluation / recorder context');
    expect(sut).toContain('<CLIENT_SECRET_ENV>');
  });

  it('explains how to undo the recording resources', () => {
    const sut = undoEntries(goals).join('\n');

    expect(sut).toContain('Disable the recording rule or archive the recording policy');
    expect(sut).not.toContain('Archive the flag');
  });
});

describe('when only event-tracking is selected', () => {
  const goals: OnboardingGoal[] = ['event-tracking'];

  it('includes .env, entry point, and track() calls without duplicates', () => {
    const sut = fileEntries(goals);

    expect(sut).toEqual([
      '- `<.env file>` — added `<CLIENT_SECRET_ENV>`',
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

  it('lists one client row plus recording policy details', () => {
    const sut = tableRows(goals);
    const clientRows = sut.filter((l) => l.includes('Client'));

    expect(clientRows).toHaveLength(1);
    expect(sut).toContainEqual('| Recording policy | <POLICY_NAME> |');
    expect(sut).toContainEqual('| Targeting key | <TARGETING_KEY> |');
  });
});
