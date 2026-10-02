import { ScreenId } from '@spotify-confidence/core';

export const SCREEN_TRANSITIONS = {
  [ScreenId.Welcome]: {
    start: ScreenId.SystemCheck,
    framework: ScreenId.SelectFramework,
    about: ScreenId.About,
  },
  [ScreenId.SystemCheck]: { next: ScreenId.SelectGoal },
  [ScreenId.SelectGoal]: { next: ScreenId.Authenticate },
  [ScreenId.Authenticate]: { next: ScreenId.InstallPlugins },
  [ScreenId.InstallPlugins]: { next: ScreenId.ConnectTools },
  [ScreenId.ConnectTools]: { next: ScreenId.OnboardProject },
  [ScreenId.OnboardProject]: { next: ScreenId.Done, skip: ScreenId.Done },
  [ScreenId.Done]: {},
  [ScreenId.About]: {},
  [ScreenId.SelectFramework]: {},
} as const satisfies Record<ScreenId, Record<string, ScreenId>>;

export type ScreenTransitions = typeof SCREEN_TRANSITIONS;
export type EventsFor<S extends ScreenId> = string & keyof ScreenTransitions[S];
