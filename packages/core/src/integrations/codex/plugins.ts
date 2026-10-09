import { execFile } from '../../exec/exec.js';
import { PLUGIN_MARKETPLACE_REPO, PLUGIN_MARKETPLACE_NAME, PLUGIN_NAME } from '../../constants.js';

type CodexListPluginsResult = {
  installed: Array<{ pluginId: string }>;
};

export async function detectPlugin(projectDir: string): Promise<boolean> {
  try {
    const config = { cwd: projectDir, timeout: 5_000 };
    const { stdout } = await execFile('codex', ['plugin', 'list', '--json'], config);
    const { installed } = JSON.parse(stdout) as CodexListPluginsResult;
    return installed.some((p) => p.pluginId.startsWith(`${PLUGIN_NAME}@`));
  } catch {
    return false;
  }
}

export async function installPlugin(projectDir: string): Promise<void> {
  const cwd = projectDir;
  await execFile('codex', ['plugin', 'marketplace', 'add', PLUGIN_MARKETPLACE_REPO], { cwd });
  await execFile('codex', ['plugin', 'add', `${PLUGIN_NAME}@${PLUGIN_MARKETPLACE_NAME}`], { cwd });
}

export async function updatePlugin(projectDir: string): Promise<void> {
  await execFile('codex', ['plugin', 'update', `${PLUGIN_NAME}@${PLUGIN_MARKETPLACE_NAME}`], {
    cwd: projectDir,
  });
}

export async function uninstallPlugin(projectDir: string): Promise<void> {
  await execFile('codex', ['plugin', 'remove', `${PLUGIN_NAME}@${PLUGIN_MARKETPLACE_NAME}`], {
    cwd: projectDir,
  });
}
