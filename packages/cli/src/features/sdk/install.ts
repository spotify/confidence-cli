import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ora from 'ora';
import {
  detectFramework,
  execFile,
  getFrameworks,
  type FrameworkConfig,
} from '@spotify-confidence/core';
import { message, fail } from '@output/print.js';

type ProjectPM = 'npm' | 'pnpm' | 'yarn' | 'bun';

type AutoInstall = { type: 'auto'; cmd: string; args: string[] };
type ManualInstall = { type: 'manual'; snippet: string };

type InstallCommand = AutoInstall | ManualInstall;

function detectProjectPM(dir: string): ProjectPM {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) return 'bun';
  return 'npm';
}

function hasPackageJsonWorkspaces(dir: string): boolean {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return false;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return Array.isArray(pkg.workspaces) || typeof pkg.workspaces === 'object';
  } catch {
    return false;
  }
}

function workspaceRootArgs(pm: ProjectPM, dir: string): string[] {
  if (pm === 'pnpm' && existsSync(join(dir, 'pnpm-workspace.yaml'))) return ['-w'];
  if (pm === 'yarn' && hasPackageJsonWorkspaces(dir) && !existsSync(join(dir, '.yarnrc.yml'))) {
    return ['-W'];
  }

  return [];
}

function buildInstallCommand(fw: FrameworkConfig, dir: string): InstallCommand {
  switch (fw.id) {
    case 'react':
    case 'nextjs':
    case 'node': {
      const pm = detectProjectPM(dir);
      return { type: 'auto', cmd: pm, args: ['add', ...workspaceRootArgs(pm, dir), fw.sdkPackage] };
    }
    case 'python':
      return { type: 'auto', cmd: 'pip', args: ['install', fw.sdkPackage] };
    case 'go':
      return { type: 'auto', cmd: 'go', args: ['get', fw.sdkPackage] };
    case 'kotlin':
      return {
        type: 'manual',
        snippet:
          `Add the following to your app/build.gradle.kts:\n\n` +
          `  dependencies {\n` +
          `      implementation("${fw.sdkPackage}:<version>")\n` +
          `  }`,
      };
    case 'java':
      return {
        type: 'manual',
        snippet:
          `Add the following to your build.gradle.kts or pom.xml:\n\n` +
          `  Gradle:\n` +
          `      implementation("${fw.sdkPackage}:<version>")\n\n` +
          `  Maven:\n` +
          `      <dependency>\n` +
          `          <groupId>com.spotify.confidence</groupId>\n` +
          `          <artifactId>openfeature-provider</artifactId>\n` +
          `          <version>VERSION</version>\n` +
          `      </dependency>`,
      };
    case 'swift':
      return {
        type: 'manual',
        snippet:
          `Add the following to your Package.swift dependencies:\n\n` +
          `  .package(\n` +
          `      url: "https://github.com/spotify/${fw.sdkPackage}.git",\n` +
          `      from: "<version>"\n` +
          `  )`,
      };
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
