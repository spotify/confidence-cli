import { callMcpTool } from '@spotify-confidence/core';
import { parsePackageName } from './parse-docs.js';

export async function resolvePackage(
  frameworkName: string,
  fallback: string,
  accessToken?: string,
): Promise<string> {
  try {
    const response = await callMcpTool(
      'confidence-docs',
      'searchDocumentation',
      { query: `${frameworkName} SDK install command` },
      { accessToken },
    );
    return parsePackageName(response) ?? fallback;
  } catch {
    return fallback;
  }
}
