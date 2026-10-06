import ora from 'ora';
import { searchDocumentation } from '@network/index.js';
import { printMcpResult } from '@output/print.js';
import { withAuth } from '@utils/index.js';

export const searchDocs = withAuth(async function searchDocs(argv, token) {
  const query = argv.query as string;
  const spinner = ora('Searching docs...').start();
  try {
    const result = await searchDocumentation(token, query, {
      pageToken: argv['page-token'] as string | undefined,
    });
    spinner.stop();
    printMcpResult(result, argv);
  } finally {
    spinner.stop();
  }
});
