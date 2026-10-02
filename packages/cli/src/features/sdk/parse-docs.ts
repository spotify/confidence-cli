const INSTALL_PREFIXES = [
  'npm install',
  'pnpm install',
  'pnpm add',
  'yarn add',
  'bun add',
  'pip install',
  'go get',
  'swift package add',
];

export function parsePackageName(docsResponse: string): string | null {
  for (const line of docsResponse.split('\n')) {
    const trimmed = line.trim();

    for (const prefix of INSTALL_PREFIXES) {
      if (trimmed.startsWith(`${prefix} `)) {
        const pkg = trimmed.slice(prefix.length).trim();
        if (pkg) return pkg;
      }
    }
  }

  return null;
}
