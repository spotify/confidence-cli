import type { ChosenIde, OnboardingGoal, PluginInstallationMethod } from '@shared-kernel/types.js';
import { addIf } from '@lib/prompt-utils.js';
import { buildToolVars } from './tool-vars.js';
import { preflight } from './sections/preflight.js';
import { scaffold } from './sections/scaffold.js';
import { integrateViaSkill } from './sections/integrate.js';
import { determineRecordingSDK, integrateRecording } from './sections/recording.js';
import { instrumentEvents } from './sections/event-tracking.js';
import { generateReport } from './sections/report.js';
import { summary, rules } from './sections/summary.js';

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

  const sections = [
    preamble(framework, projectDir, isEmptyProject, goals),
    preflight(tools),
    addIf(isEmptyProject, () => scaffold(framework, steps.next())),

    addIf(withFlags, () =>
      integrateViaSkill(framework, steps.next(), isEmptyProject, ide, pluginInstallMethod),
    ),

    addIf(withRecordings, () => determineRecordingSDK(framework, steps.next(), tools)),
    addIf(withRecordings, () => integrateRecording(steps.next(), isEmptyProject)),

    addIf(withEventTracking, () =>
      instrumentEvents(framework, steps.next(), isEmptyProject, ide, pluginInstallMethod),
    ),

    generateReport({
      step: steps.next(),
      isEmptyProject,
      goals,
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
