export function flagStatus(flag: { archived?: boolean; enabled?: boolean }): string {
  if (flag.archived) return 'archived';
  return flag.enabled ? 'enabled' : 'disabled';
}
