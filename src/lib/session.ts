import { randomUUID } from 'node:crypto';
import type {
  IdeId,
  OnboardingGoal,
  PluginInstallationMethod,
  DetectedProvider,
} from '@shared-kernel/types.js';

export type WizardSession = {
  /**
   * Unique identifier for this wizard run.
   * @default crypto.randomUUID()
   */
  sessionId: string;
  /**
   * Screen the wizard is currently displaying.
   * @default ScreenId.Welcome
   */
  currentScreen: ScreenId;
  /**
   * Detected or user-selected framework identifier.
   * @default null
   * @example "react", "nextjs", "node"
   */
  framework: string | null;
  /**
   * How the framework value was obtained — auto-detected or manually selected.
   * @default null
   */
  frameworkSource: FrameworkSource | null;
  /**
   * Screens the user has already passed through in this session.
   * @default new Set()
   */
  completedScreens: Set<ScreenId>;
  /**
   * Chronological log of user interactions, used by the debug overlay.
   * @default []
   */
  debugLog: DebugEntry[];
  /**
   * When true, all side effects (auth, installs, onboarding) are simulated.
   * @default false
   */
  dryRun: boolean;
  /**
   * When true, the debug log overlay is visible.
   * @default false
   */
  debug: boolean;
  /**
   * Absolute path to the project being onboarded.
   * @default process.cwd()
   */
  projectDir: string;
  /**
   * Results of prerequisite checks keyed by check name.
   * @default {}
   * @example { "node": { name: "node", found: true, version: "24.1.0" } }
   */
  systemChecks: Record<string, CheckResult>;
  /**
   * Current authentication state and credentials.
   * @default { status: 'idle' }
   */
  authState: AuthState;
  /**
   * IDE the user chose for the onboarding flow.
   * @default null
   */
  ide: IdeId | null;
  /**
   * IDEs that received plugin installations during this session.
   * @default []
   */
  pluginTargets: IdeId[];
  /**
   * How plugins were installed — via CLI marketplace or local download.
   * @default null
   */
  pluginInstallMethod: PluginInstallationMethod | null;
  /**
   * MCP server names that were successfully connected.
   * @default []
   * @see {@link ScreenId.ConnectTools}
   */
  connectedMcps: string[];
  /**
   * Whether the project directory was empty at the start of onboarding.
   * @default false
   */
  isEmptyProject: boolean;
  /**
   * Competing feature-flag providers found in the project's dependencies.
   * @default []
   */
  detectedProviders: DetectedProvider[];
  /**
   * Goals the user selected for the onboarding session.
   * @default []
   */
  onboardingGoals: OnboardingGoal[];
  /**
   * Latest status line emitted by the onboarding process.
   * @default ""
   */
  onboardingStatus: string;
  /**
   * Path to the generated quickstart report, relative to the project dir.
   * @default null
   * @example "CONFIDENCE_QUICKSTART.md"
   */
  reportFile: string | null;
  /**
   * Human-readable summaries of files created or modified during onboarding.
   * @default []
   * @example ["Added @spotify-confidence/sdk", "Created confidence.config.ts"]
   */
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
