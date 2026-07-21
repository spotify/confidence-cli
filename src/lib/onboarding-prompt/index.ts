import type { ChosenIde, OnboardingGoal } from '../session.js';
import { addIf } from '../prompt-utils.js';
import { preflight, scaffold } from './preflight.js';
import { determineSDK, resolveClient } from './sdk.js';
import { integrateSDK, integrateViaSkill } from './integrate.js';
import { determineRecordingSDK, integrateRecording } from './session-recording.js';
import { migrateFlags } from './migration.js';
import { generateReport, summary, rules } from './report.js';
import { buildToolVars } from './tool-vars.js';

type MigrationOption = {
  providerName: string;
  skillName: string;
};

type PromptOptions = {
  framework: string;
  projectDir: string;
  ide?: ChosenIde;
  isEmptyProject?: boolean;
  goal?: OnboardingGoal;
  migrations?: MigrationOption[];
  hasPlugins?: boolean;
};

export function buildOnboardingPrompt({
  framework,
  projectDir,
  ide = 'claude',
  isEmptyProject = false,
  goal = 'feature-flags',
  migrations = [],
  hasPlugins = false,
}: PromptOptions): string {
  const steps = new StepCounter(isEmptyProject ? 2 : 1);
  const tools = buildToolVars(ide);

  const includingFlags = goal === 'feature-flags' || goal === 'all';
  const includingRecording = goal === 'session-recording' || goal === 'all';
  const usingSkill = includingFlags && hasPlugins;

  const sections = [
    preamble(framework, projectDir, isEmptyProject, goal),
    preflight(tools),
    addIf(isEmptyProject, () => scaffold(framework, steps.next())),

    usingSkill
      ? [integrateViaSkill(framework, steps.next(), isEmptyProject, ide)]
      : [
          addIf(includingFlags, () => determineSDK(framework, steps.next(), tools)),
          addIf(includingFlags, () => resolveClient(framework, steps.next(), tools)),
          addIf(includingFlags, () =>
            integrateSDK(steps.next(), steps.current - 2, isEmptyProject, tools),
          ),
        ],

    addIf(includingRecording, () => determineRecordingSDK(framework, steps.next(), tools)),
    addIf(includingRecording, () => integrateRecording(steps.next(), isEmptyProject)),

    ...migrations.map((m) => migrateFlags(m, steps.next())),

    generateReport({ step: steps.next(), isEmptyProject, goal, hasPlugins }),
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

const GOAL_PREAMBLE: Record<OnboardingGoal, string> = {
  'feature-flags': 'the Confidence SDK',
  'session-recording': 'Confidence Session Recording',
  all: 'the Confidence SDK and Session Recording',
};

function preamble(
  framework: string,
  projectDir: string,
  isEmptyProject: boolean,
  goal: OnboardingGoal,
): string {
  const action = isEmptyProject ? 'Generate a sample app and integrate' : 'Integrate';
  return `\
${action} ${GOAL_PREAMBLE[goal]} into a ${framework} project at ${projectDir}.
Follow these steps in order, printing a short status line before each one.`;
}
