import type { IdeId } from '@spotify-confidence/shared-kernel';
import { getIntegration, type McpStatusMap } from '@spotify-confidence/core';

export async function getMcpStatuses(ideId: IdeId, projectDir: string): Promise<McpStatusMap> {
  const integration = getIntegration(ideId);
  return integration.detectMcpStatuses(projectDir);
}
