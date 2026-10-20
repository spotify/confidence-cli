import { listEventDefinitions } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withCrossCutting } from '@composition';

export const listEvents = withCrossCutting(async function listEvents(argv, token) {
  const result = await listEventDefinitions(token, {
    pageToken: argv['page-token'] as string | undefined,
  });
  printMcpResult(result, argv);
});
