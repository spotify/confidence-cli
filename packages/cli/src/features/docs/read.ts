import ora from 'ora';
import { CONFIDENCE_DOCS_URL } from '@spotify-confidence/core';
import { getFullSource } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '@utils/require-auth.js';

function normalizeSource(input: string): string {
  if (input.includes('://')) return input;
  const path = input.startsWith('/docs/') ? input.slice('/docs/'.length) : input.replace(/^\/+/, '');
  return `${CONFIDENCE_DOCS_URL}/${path}`;
}

export const readDocs = withAuth(async function readDocs(argv, token) {
  const page = normalizeSource(argv.page as string);
  const spinner = ora('Fetching page...').start();
  try {
    const result = await getFullSource(token, page);
    spinner.stop();
    printMcpResult(result, argv);
  } finally {
    spinner.stop();
  }
});
