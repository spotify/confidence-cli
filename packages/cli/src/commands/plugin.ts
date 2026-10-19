import type { Argv } from 'yargs';
import { noop } from '@spotify-confidence/shared-kernel';
import {
  resolveIde,
  resolveFlag,
  resolveProjectDir,
  resolveScope,
  requireClaudeForScope,
} from '@features/ide/index.js';
import {
  installPluginForIde,
  uninstallPluginForIde,
  updatePluginForIde,
} from '@features/plugin/index.js';
import { safely, dryRunGuard } from '@utils/index.js';

export const pluginCommand = {
  command: 'plugin <action>',
  describe: 'Manage the Confidence AI plugin for your IDE',
  builder(yargs: Argv) {
    return yargs
      .option('dir', {
        type: 'string',
        describe: 'Target project directory',
      })
      .option('ide', {
        type: 'string',
        choices: ['claude', 'cursor', 'codex'] as const,
        describe: 'AI coding agent to configure',
      })
      .option('scope', {
        type: 'string',
        choices: ['project', 'local', 'global'] as const,
        describe: 'Installation scope (only supported for Claude Code)',
      })
      .command(
        'install',
        'Install the Confidence AI plugin for your AI coding agent',
        noop,
        safely(installCmd),
      )
      .command(
        'update',
        'Update the Confidence AI plugin to the latest version',
        noop,
        safely(updateCmd),
      )
      .command(
        'uninstall',
        'Remove the Confidence AI plugin from your AI coding agent',
        noop,
        safely(uninstallCmd),
      )
      .demandCommand(1, 'Run "confidence plugin --help" to see available actions.')
      .strict();
  },
  handler() {},
};

async function installCmd(argv: Record<string, unknown>): Promise<void> {
  const ide = await resolveIde(resolveFlag('ide', argv));
  const scope = resolveScope(argv);
  requireClaudeForScope(ide, scope);
  if (dryRunGuard(argv, { action: 'install', ide, scope })) return;
  await installPluginForIde(ide, resolveProjectDir(argv), scope);
}

async function updateCmd(argv: Record<string, unknown>): Promise<void> {
  const ide = await resolveIde(resolveFlag('ide', argv));
  const scope = resolveScope(argv);
  requireClaudeForScope(ide, scope);
  if (dryRunGuard(argv, { action: 'update', ide, scope })) return;
  await updatePluginForIde(ide, resolveProjectDir(argv), scope);
}

async function uninstallCmd(argv: Record<string, unknown>): Promise<void> {
  const ide = await resolveIde(resolveFlag('ide', argv));
  const scope = resolveScope(argv);
  requireClaudeForScope(ide, scope);
  if (dryRunGuard(argv, { action: 'uninstall', ide, scope })) return;
  await uninstallPluginForIde(ide, resolveProjectDir(argv), scope);
}
