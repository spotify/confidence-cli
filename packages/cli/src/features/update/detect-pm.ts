export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'npx';

export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent ?? '';

  if (process.env.npm_command === 'exec' || userAgent.startsWith('npx/')) {
    return 'npx';
  }

  if (userAgent.startsWith('yarn/')) return 'yarn';
  if (userAgent.startsWith('pnpm/')) return 'pnpm';
  if (userAgent.startsWith('bun/')) return 'bun';

  const scriptPath = process.argv[1] ?? '';
  if (scriptPath.includes('/pnpm/') || scriptPath.includes('\\pnpm\\')) return 'pnpm';
  if (scriptPath.includes('/yarn/') || scriptPath.includes('\\yarn\\')) return 'yarn';
  if (scriptPath.includes('/.bun/') || scriptPath.includes('\\.bun\\')) return 'bun';

  return 'npm';
}
