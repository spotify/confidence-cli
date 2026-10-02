import type { IdeId } from '@spotify-confidence/shared-kernel';
import { getIntegration, type McpServerName, type McpServerStatus } from '@spotify-confidence/core';

export async function getMcpStatuses(
  ideId: IdeId,
  projectDir: string,
): Promise<Record<McpServerName, McpServerStatus>> {
  const integration = getIntegration(ideId);
  return integration.detectMcpStatuses(projectDir);
}
