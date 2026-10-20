import { createCryptoKey } from '@network/index.js';
import { printMcpResult } from '@output/index.js';
import { withCrossCutting } from '@composition';
import { tryHandleMcpError, dryRunGuard } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { requireKeys } from '@utils/validation.js';

type CryptoKeyParams = {
  'crypto-key-id': string;
};

export const createCryptoKeyCmd = withCrossCutting(async function createCryptoKeyCmd(argv, token) {
  const params = resolveInput<CryptoKeyParams>(argv, ['crypto-key-id']);
  requireKeys(params, ['crypto-key-id']);

  if (dryRunGuard(argv, { cryptoKeyId: params['crypto-key-id'] })) return;

  const result = await createCryptoKey(token, params['crypto-key-id']);
  if (tryHandleMcpError(result)) return;
  printMcpResult(result, argv);
});
