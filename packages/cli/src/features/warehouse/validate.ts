import { extractText, parseToolJson } from '@spotify-confidence/core';
import { validateWarehouseConfig } from '@network/index.js';
import { resolveFormat, formatJson, message, print, extractFlags } from '@output/index.js';
import { withAuth, tryHandleMcpError } from '@utils/index.js';
import { resolveInput } from '@input/index.js';
import { requireKeys } from '@utils/validation.js';
import type { WarehouseTypeParams } from './types.js';

type ValidationCheck = {
  key: string;
  description: string;
  success: boolean;
  error?: string;
};

type ValidateResponse = {
  successful: boolean;
  validation: ValidationCheck[];
  configurationResponse?: unknown;
};

type ValidationRow = {
  status: string;
  key: string;
  description: string;
  error: string;
};

export const validateConfig = withAuth(async function validateConfig(argv, token) {
  const params = resolveInput<WarehouseTypeParams>(argv, ['warehouse-type', 'config-json']);
  requireKeys(params, ['warehouse-type', 'config-json']);

  const result = await validateWarehouseConfig(
    token,
    params['warehouse-type'],
    params['config-json'],
  );
  if (tryHandleMcpError(result)) return;

  let data: ValidateResponse;
  try {
    data = parseToolJson<ValidateResponse>(result);
  } catch {
    message(extractText(result));
    return;
  }

  const flags = extractFlags(argv);
  const format = resolveFormat(flags);

  if (format === 'json') {
    message(formatJson(data));
    return;
  }

  message(data.successful ? 'Validation passed.' : 'Validation failed.');

  print<ValidationRow>({
    data: (data.validation ?? []).map((v) => ({
      status: v.success ? 'PASS' : 'FAIL',
      key: v.key,
      description: v.description,
      error: v.error ?? '',
    })),
    columns: [
      { key: 'status', header: 'Status', width: 6 },
      { key: 'key', header: 'Check', width: 20 },
      { key: 'description', header: 'Description' },
      { key: 'error', header: 'Error' },
    ],
    flags,
    empty: 'No validation checks returned.',
  });

  if (!data.successful) {
    process.exitCode = 1;
  }
});
