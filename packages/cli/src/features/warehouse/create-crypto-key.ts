import { createCryptoKey } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withAuth, tryHandleMcpError } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { requireKeys } from '@utils/validation.js';

type CryptoKeyParams = {
  'crypto-key-id': string;
};

export const createCryptoKeyCmd = withAuth(async function createCryptoKeyCmd(argv, token) {
  const params = resolveInput<CryptoKeyParams>(argv, ['crypto-key-id']);
  requireKeys(params, ['crypto-key-id']);

  const result = await createCryptoKey(token, params['crypto-key-id']);
  if (tryHandleMcpError(result)) return;
  printMcpResult(result, argv);
});
