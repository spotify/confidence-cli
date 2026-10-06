import ora from 'ora';
import { grepDocumentation } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '@utils/require-auth.js';

export const grepDocs = withAuth(async function grepDocs(argv, token) {
  const pattern = argv.pattern as string;
  const spinner = ora('Searching docs...').start();
  try {
    const result = await grepDocumentation(token, pattern);
    spinner.stop();
    printMcpResult(result, argv);
  } finally {
    spinner.stop();
  }
});
