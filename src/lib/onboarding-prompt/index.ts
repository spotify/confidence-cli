import type { PluginInstallationMethod } from '@integrations/types.js';
import type { ChosenIde, OnboardingGoal } from '../session.js';
import { addIf } from '../prompt-utils.js';
import { preflight, scaffold } from './preflight.js';
import { determineSDK, resolveClient } from './sdk.js';
import { integrateSDK, integrateViaSkill } from './integrate.js';
import { determineRecordingSDK, integrateRecording } from './session-recording.js';
import { instrumentEvents } from './event-tracking.js';
import { generateReport, summary, rules } from './report.js';
import { buildToolVars } from './tool-vars.js';

type PromptOptions = {
  framework: string;
  projectDir: string;
  ide?: ChosenIde;
  isEmptyProject?: boolean;
  goals?: OnboardingGoal[];
  hasProviders?: boolean;
  pluginInstallMethod?: PluginInstallationMethod | null;
};

export function buildOnboardingPrompt({
  framework,
  projectDir,
  ide = 'claude',
  isEmptyProject = false,
  goals = ['feature-flags'],
  hasProviders = false,
  pluginInstallMethod = null,
}: PromptOptions): string {
  const steps = new StepCounter(isEmptyProject ? 2 : 1);
  const tools = buildToolVars(ide);

  const withFlags = goals.includes('feature-flags');
  const withRecordings = goals.includes('session-recordings');
  const withEventTracking = goals.includes('event-tracking');
  const viaSkill = withFlags && hasPlugins;

  const sections = [
    preamble(framework, projectDir, isEmptyProject, goals),
    preflight(tools),
    addIf(isEmptyProject, () => scaffold(framework, steps.next())),

    ...(viaSkill
      ? [integrateViaSkill(framework, steps.next(), isEmptyProject, ide)]
      : [
          addIf(withFlags, () => determineSDK(framework, steps.next(), tools)),
          addIf(withFlags, () => resolveClient(framework, steps.next(), tools)),
          addIf(withFlags, () =>
            integrateSDK(steps.next(), steps.current - 2, isEmptyProject, tools),
          ),
        ]),

    addIf(withRecordings, () => determineRecordingSDK(framework, steps.next(), tools)),
    addIf(withRecordings, () => integrateRecording(steps.next(), isEmptyProject)),

    addIf(withEventTracking, () => instrumentEvents(framework, steps.next(), isEmptyProject, ide)),

    generateReport({
      step: steps.next(),
      isEmptyProject,
      goals,
      hasPlugins,
      hasProviders,
    }),
    summary(steps.next()),
    rules(),
  ];

  return sections.filter(Boolean).join('\n\n');
}

class StepCounter {
  current: number;
  constructor(start: number) {
    this.current = start;
  }
  next(): number {
    return ++this.current;
  }
}

const GOAL_LABELS: Record<OnboardingGoal, string> = {
  'feature-flags': 'the Confidence SDK',
  'session-recordings': 'Confidence Session Recording',
  'event-tracking': 'Confidence Event Tracking',
};

function goalPreamble(goals: OnboardingGoal[]): string {
  const labels = goals.map((g) => GOAL_LABELS[g]);

  if (labels.length === 0) return '';
  if (labels.length <= 2) return labels.join(' and ');
  return labels.slice(0, -1).join(', ') + ', and ' + labels.at(-1);
}

function preamble(
  framework: string,
  projectDir: string,
  isEmptyProject: boolean,
  goals: OnboardingGoal[],
): string {
  const action = isEmptyProject ? 'Generate a sample app and integrate' : 'Integrate';
  return `\
${action} ${goalPreamble(goals)} into a ${framework} project at ${projectDir}.
Follow these steps in order, printing a short status line before each one.`;
}
