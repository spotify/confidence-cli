import type { Argv } from 'yargs';
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
import { safely } from '@utils/safely.js';

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
        default: 'project',
        describe: 'Installation scope (currently supports only by Claude Code)',
      })
      .command(
        'install',
        'Install the Confidence AI plugin for your AI coding agent',
        () => {},
        safely(installCmd),
      )
      .command(
        'update',
        'Update the Confidence AI plugin to the latest version',
        () => {},
        safely(updateCmd),
      )
      .command(
        'uninstall',
        'Remove the Confidence AI plugin from your AI coding agent',
        () => {},
        safely(uninstallCmd),
      )
      .demandCommand(1, 'Run "confidence plugin --help" to see available actions.')
      .strict();
  },
  handler() {},
};

async function installCmd(argv: Record<string, unknown>): Promise<void> {
  const ideId = await resolveIde(resolveFlag('ide', argv));
  const scope = resolveScope(argv);
  requireClaudeForScope(ideId, scope);
  await installPluginForIde(ideId, resolveProjectDir(argv), scope);
}

async function updateCmd(argv: Record<string, unknown>): Promise<void> {
  const ideId = await resolveIde(resolveFlag('ide', argv));
  const scope = resolveScope(argv);
  requireClaudeForScope(ideId, scope);
  await updatePluginForIde(ideId, resolveProjectDir(argv), scope);
}

async function uninstallCmd(argv: Record<string, unknown>): Promise<void> {
  const ideId = await resolveIde(resolveFlag('ide', argv));
  const scope = resolveScope(argv);
  requireClaudeForScope(ideId, scope);
  await uninstallPluginForIde(ideId, resolveProjectDir(argv), scope);
}
