import { listEventDefinitions } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '@utils/index.js';

export const listEvents = withAuth(async function listEvents(argv, token) {
  const result = await listEventDefinitions(token, {
    pageToken: argv['page-token'] as string | undefined,
  });
  printMcpResult(result, argv);
});
