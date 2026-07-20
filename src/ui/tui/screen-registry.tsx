import type { ReactNode } from 'react';
import { ScreenId } from '@lib/session.js';
import { WelcomeScreen } from './screens/welcome/index.js';
import { AboutScreen } from './screens/about/index.js';
import { SelectFrameworkScreen } from './screens/select-framework/index.js';
import { SystemCheckScreen } from './screens/system-check/index.js';
import { InstallPluginsScreen } from './screens/install-plugins/index.js';
import { AuthenticateScreen } from './screens/authenticate/index.js';
import { ConnectToolsScreen } from './screens/connect-tools/index.js';
import { OnboardProjectScreen } from './screens/onboard-project/index.js';
import { DoneScreen } from './screens/done/index.js';

export function createScreens(): Record<string, ReactNode> {
  return {
    [ScreenId.Welcome]: <WelcomeScreen />,
    [ScreenId.About]: <AboutScreen />,
    [ScreenId.SelectFramework]: <SelectFrameworkScreen />,
    [ScreenId.SystemCheck]: <SystemCheckScreen />,
    [ScreenId.InstallPlugins]: <InstallPluginsScreen />,
    [ScreenId.Authenticate]: <AuthenticateScreen />,
    [ScreenId.ConnectTools]: <ConnectToolsScreen />,
    [ScreenId.OnboardProject]: <OnboardProjectScreen />,
    [ScreenId.Done]: <DoneScreen />,
  };
}
