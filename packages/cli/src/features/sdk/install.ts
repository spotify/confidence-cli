import ora from 'ora';
import {
  detectFramework,
  execFile,
  getFrameworks,
  type FrameworkConfig,
} from '@spotify-confidence/core';
import { message, fail } from '@output/print.js';
import type { InstallCommand } from './install-types.js';
import { buildNodeInstall } from './install-node.js';
import { buildPythonInstall } from './install-python.js';
import { buildJavaInstall, buildKotlinInstall } from './install-jvm.js';
import { buildGoInstall, buildSwiftInstall } from './install-native.js';

function buildInstallCommand(fw: FrameworkConfig, dir: string): InstallCommand {
  switch (fw.id) {
    case 'react':
    case 'nextjs':
    case 'node':
      return buildNodeInstall(fw.sdkPackage, dir);
    case 'python':
      return buildPythonInstall(fw.sdkPackage, dir);
    case 'go':
      return buildGoInstall(fw.sdkPackage);
    case 'kotlin':
      return buildKotlinInstall(fw.sdkPackage);
    case 'java':
      return buildJavaInstall(fw.sdkPackage);
    case 'swift':
      return buildSwiftInstall(fw.sdkPackage);
    default: {
      const _exhaustive: never = fw.id as never;
      throw new Error(`Unknown framework: ${_exhaustive}`);
    }
  }
}

export async function runSdkInstall(argv: Record<string, unknown>): Promise<void> {
  const dir = (argv.dir as string | undefined) ?? process.cwd();
  const spinner = ora('Detecting framework...').start();

  const fw = await detectFramework(dir);

  if (!fw) {
    spinner.fail('Could not detect a framework.');
    const names = getFrameworks().map((f) => f.name);
    fail(
      `Supported frameworks: ${names.join(', ')}.\n` +
        `Make sure you are in a project directory, or use --dir to specify one.`,
    );
    return;
  }

  spinner.succeed(`Detected ${fw.name}.`);

  const install = buildInstallCommand(fw, dir);

  if (install.type === 'manual') {
    message(`\n${install.snippet}\n\nDocs: ${fw.docsUrl}`);
    return;
  }

  const installSpinner = ora(`Installing ${fw.sdkPackage}...`).start();

  try {
    await execFile(install.cmd, install.args, { cwd: dir });
    installSpinner.succeed(`Installed ${fw.sdkPackage}.`);
  } catch (err) {
    installSpinner.fail(`Failed to install ${fw.sdkPackage}.`);
    const msg = err instanceof Error ? err.message : String(err);
    fail(`${install.cmd} ${install.args.join(' ')} failed:\n${msg}`);
  }
}
