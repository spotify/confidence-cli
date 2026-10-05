export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'npx';

function fromInstallPath(scriptPath: string): PackageManager | undefined {
  if (scriptPath.includes('/pnpm/') || scriptPath.includes('\\pnpm\\')) return 'pnpm';
  if (scriptPath.includes('/yarn/') || scriptPath.includes('\\yarn\\')) return 'yarn';
  if (scriptPath.includes('/.bun/') || scriptPath.includes('\\.bun\\')) return 'bun';
  if (scriptPath.includes('/npm/') || scriptPath.includes('\\npm\\')) return 'npm';
  return undefined;
}

function isEphemeralRunner(): boolean {
  const userAgent = process.env.npm_config_user_agent ?? '';

  if (process.env.npm_command === 'exec' || userAgent.startsWith('npx/')) return true;
  if (process.env.npm_execpath?.includes('dlx')) return true;

  return false;
}

export function detectPackageManager(): PackageManager {
  if (isEphemeralRunner()) return 'npx';

  const scriptPath = process.argv[1] ?? '';
  return fromInstallPath(scriptPath) ?? 'npm';
}
