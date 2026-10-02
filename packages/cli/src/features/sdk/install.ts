import ora from 'ora';
import { message, fail } from '@output/print.js';
import { detectPackageManager } from '@spotify-confidence/core';
import type { FrameworkId } from '@spotify-confidence/core';
import { getInstallStrategy } from './install-strategy.js';
import { resolveFramework } from './resolve-framework.js';
import { resolvePackage } from './resolve-package.js';
import { runCommand } from './run-command.js';

type InstallSdkOpts = {
  projectDir: string;
  accessToken?: string;
  sdkId?: FrameworkId;
};

export async function installSdk({
  projectDir,
  accessToken,
  sdkId,
}: InstallSdkOpts): Promise<void> {
  const pm = detectPackageManager(projectDir);
  if (!pm) {
    fail(`No project found in ${projectDir}. Run from a project directory or use --dir.`);
    return;
  }

  const framework = await resolveFramework(projectDir, sdkId);
  if (!framework) {
    fail(
      sdkId
        ? `Unknown SDK: ${sdkId}. Run "confidence sdk list" to see available SDKs.`
        : 'Could not detect project framework. Specify an SDK with --sdk or run from a project directory.',
    );
    return;
  }

  const installStrategy = getInstallStrategy(pm);

  if (installStrategy.kind === 'manual') {
    message(`Add ${framework.sdkPackage} to your ${installStrategy.manifestFile}.`);
    message(`See: ${framework.docsUrl}`);
    return;
  }

  const spinner = ora('Looking up install instructions...').start();
  const sdkPackage = await resolvePackage(framework.name, framework.sdkPackage, accessToken);

  spinner.text = `Installing ${sdkPackage}...`;
  const result = await runCommand(installStrategy.buildCommand(sdkPackage), projectDir);

  if (result.ok) {
    spinner.succeed(`Installed ${sdkPackage}`);
    return;
  }

  if ('aborted' in result) {
    spinner.stop();
    return;
  }

  spinner.fail();
  fail(`Failed to install ${sdkPackage}: ${result.error}`);
}
