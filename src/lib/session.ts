import { randomUUID } from 'node:crypto';
import type {
  IdeId,
  OnboardingGoal,
  PluginInstallationMethod,
  DetectedProvider,
} from '@shared-kernel/types.js';

export type WizardSession = {
  sessionId: string;
  currentScreen: ScreenId;
  framework: string | null;
  frameworkSource: FrameworkSource | null;
  completedScreens: Set<ScreenId>;
  debugLog: DebugEntry[];
  dryRun: boolean;
  debug: boolean;
  projectDir: string;
  systemChecks: Record<string, CheckResult>;
  authState: AuthState;
  ide: IdeId | null;
  pluginTargets: IdeId[];
  pluginInstallMethod: PluginInstallationMethod | null;
  connectedMcps: string[];
  isEmptyProject: boolean;
  detectedProviders: DetectedProvider[];
  onboardingGoals: OnboardingGoal[];
  onboardingStatus: string;
  reportFile: string | null;
  codeChanges: string[];
};

export type FrameworkSource = 'detected' | 'selected';

export type DebugEntry = {
  screen: ScreenId;
  input: string;
  output: string;
};

export type CheckResult = {
  name: string;
  found: boolean;
  version?: string;
};

export type AuthState = {
  status: 'idle' | 'pending' | 'authenticated' | 'failed';
  token?: string;
  refreshToken?: string;
  region?: 'EU' | 'US';
  workspace?: string;
  error?: string;
};

export enum ScreenId {
  Welcome = 'welcome',
  About = 'about',
  SelectFramework = 'select-framework',
  SystemCheck = 'system-check',
  InstallPlugins = 'install-plugins',
  Authenticate = 'authenticate',
  ConnectTools = 'connect-tools',
  SelectGoal = 'select-goal',
  OnboardProject = 'onboard-project',
  Done = 'done',
}

export function createSession(opts?: {
  dryRun?: boolean;
  debug?: boolean;
  dir?: string;
}): WizardSession {
  return {
    sessionId: randomUUID(),
    currentScreen: ScreenId.Welcome,
    framework: null,
    frameworkSource: null,
    completedScreens: new Set(),
    debugLog: [],
    dryRun: opts?.dryRun ?? false,
    debug: opts?.debug ?? false,
    projectDir: opts?.dir ?? process.cwd(),
    systemChecks: {},
    authState: { status: 'idle' },
    ide: null,
    pluginTargets: [],
    pluginInstallMethod: null,
    connectedMcps: [],
    isEmptyProject: false,
    detectedProviders: [],
    onboardingGoals: [],
    onboardingStatus: '',
    reportFile: null,
    codeChanges: [],
  };
}
