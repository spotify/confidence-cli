import { getEventDefinition } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withCrossCutting } from '@composition';

export const getEvent = withCrossCutting(async function getEvent(argv, token) {
  const name = argv.name as string;
  const result = await getEventDefinition(token, name);
  printMcpResult(result, argv);
});
