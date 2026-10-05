import { getEventDefinition } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '../../utils/require-auth.js';

export const getEvent = withAuth(async function getEvent(argv, token) {
  const name = argv.name as string;
  const result = await getEventDefinition(token, name);
  printMcpResult(result, argv);
});
