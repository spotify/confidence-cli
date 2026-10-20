import { mcpCallTool as mcpBase, apiRequest as apiBase } from '@spotify-confidence/core';
import { withDebug } from '@utils/debug.js';

export const mcpCallTool = withDebug(mcpBase, (_opts, toolName, _args?) => toolName);
export const apiRequest = withDebug(apiBase, (opts) => `${opts.method ?? 'GET'} ${opts.path}`);
