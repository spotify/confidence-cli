import type { Ora } from 'ora';
import { fail } from '@output/print.js';
import type { McpServer } from '@spotify-confidence/core';

export function reportResults(opts: {
  spinner: Ora;
  servers: McpServer[];
  action: 'install' | 'uninstall' | 'update';
  failed: string[];
  success: string;
}): void {
  const { spinner, action, success, failed, servers } = opts;
  const errorReport = failed.join('\n');

  if (failed.length === 0) {
    spinner.succeed(success);
    return;
  }

  if (failed.length === servers.length) {
    spinner.stop();
    fail(`Failed to ${action} MCP servers:\n${errorReport}`);
    return;
  }

  spinner.stop();
  fail(`Some MCP servers failed to ${action}:\n${errorReport}`);
}
