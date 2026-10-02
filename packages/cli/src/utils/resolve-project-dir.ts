export function resolveProjectDir(argv: Record<string, unknown>): string {
  return (argv.dir as string | undefined) ?? (argv.project as string | undefined) ?? process.cwd();
}
