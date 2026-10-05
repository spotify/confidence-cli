import ora from 'ora';
import { execFile, isNewerVersion } from '@spotify-confidence/core';
import { CLI_VERSION } from '../../meta.js';
import { message, fail } from '@output/print.js';
import { detectPackageManager, type PackageManager } from './detect-pm.js';

const PACKAGE_NAME = '@spotify-confidence/cli';

async function fetchLatestVersion(): Promise<string> {
  const { stdout } = await execFile('npm', ['view', PACKAGE_NAME, 'version']);
  return stdout.trim();
}

const UPDATE_COMMANDS: Record<Exclude<PackageManager, 'npx'>, [string, string[]]> = {
  npm: ['npm', ['install', '-g', `${PACKAGE_NAME}@latest`]],
  pnpm: ['pnpm', ['add', '-g', `${PACKAGE_NAME}@latest`]],
  yarn: ['yarn', ['global', 'add', `${PACKAGE_NAME}@latest`]],
  bun: ['bun', ['install', '-g', `${PACKAGE_NAME}@latest`]],
};

async function isYarnBerry(): Promise<boolean> {
  try {
    const { stdout } = await execFile('yarn', ['--version']);
    const major = Number(stdout.trim().split('.')[0]);
    return major >= 2;
  } catch {
    return false;
  }
}

export async function runUpdate(): Promise<void> {
  const spinner = ora('Checking for updates...').start();

  let latest: string;
  try {
    latest = await fetchLatestVersion();
  } catch {
    spinner.stop();
    fail('Could not reach the npm registry. Check your network connection and try again.');
    return;
  }

  if (!isNewerVersion(latest, CLI_VERSION)) {
    spinner.succeed(`Already up to date (v${CLI_VERSION}).`);
    return;
  }

  spinner.stop();

  const pm = detectPackageManager();

  if (pm === 'npx') {
    message(
      `A newer version is available: v${CLI_VERSION} → v${latest}\n` +
        `You're running via npx. Run \`npx ${PACKAGE_NAME}@latest\` to use the latest version.`,
    );
    return;
  }

  if (pm === 'yarn' && (await isYarnBerry())) {
    message(
      `A newer version is available: v${CLI_VERSION} → v${latest}\n` +
        `Yarn Berry (v2+) does not support global installs. Reinstall with:\n` +
        `  npm install -g ${PACKAGE_NAME}@latest`,
    );
    return;
  }

  const updateSpinner = ora(`Updating ${PACKAGE_NAME} v${CLI_VERSION} → v${latest}...`).start();

  const [cmd, args] = UPDATE_COMMANDS[pm];
  try {
    await execFile(cmd, args);
    updateSpinner.succeed(`Updated ${PACKAGE_NAME} v${CLI_VERSION} → v${latest}.`);
  } catch (err) {
    updateSpinner.fail('Update failed.');
    const msg = err instanceof Error ? err.message : String(err);
    fail(
      msg.includes('EACCES')
        ? `Permission denied. Fix your npm global prefix to avoid this:\n` +
          `  https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally`
        : `${cmd} ${args.join(' ')} failed: ${msg}`,
    );
  }
}
