import { runUpdate } from '@features/update/index.js';

export const updateCommand = {
  command: 'update',
  describe: 'Update the Confidence CLI to the latest version',
  handler: runUpdate,
};
