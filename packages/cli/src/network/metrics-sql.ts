import type { ApiRequestOptions, ApiResponse } from '@spotify-confidence/core';
import { metricsRequest } from './metrics.js';
import { requireRecord, requireString, resourcePath } from './metrics-types.js';

export type SqlJob = Record<string, unknown> & { name: string; state: string };
type RequestOptions = Pick<ApiRequestOptions, 'signal' | 'timeoutMs'>;

const JOB_STATES = [
  'STATE_UNSPECIFIED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'PENDING',
  'PENDING_RETRY',
  'THROTTLED',
] as const;

export async function previewSqlQuery(
  token: string,
  query: string,
): Promise<ApiResponse<{ job: string }>> {
  const result = await metricsRequest<unknown>(token, {
    path: '/v1/sqlQuery:preview',
    method: 'POST',
    body: { query },
  });
  if (!result.ok) {
    if (
      result.status === 0 ||
      result.status >= 500 ||
      (result.status >= 200 && result.status < 300)
    ) {
      return unknownPreviewOutcome(result.error.message);
    }
    return result;
  }

  try {
    const data = requireRecord(result.data, 'SQL preview response');
    const job = requireString(data.job, 'SQL preview job');
    resourcePath(job, 'sqlJobs');
    return { ok: true, data: { job } };
  } catch (error) {
    return unknownPreviewOutcome(
      error instanceof Error ? error.message : 'Invalid preview response.',
    );
  }
}

function unknownPreviewOutcome(message: string): ApiResponse<never> {
  return {
    ok: false,
    status: 0,
    error: {
      code: 0,
      message: `${message} Preview outcome is unknown; no retry was attempted. Check warehouse query history before retrying.`,
    },
  };
}

export async function getSqlJob(
  token: string,
  name: string,
  options: RequestOptions = {},
): Promise<ApiResponse<SqlJob>> {
  const result = await metricsRequest<unknown>(token, {
    ...options,
    path: resourcePath(name, 'sqlJobs'),
  });
  if (!result.ok) return result;

  const data = requireRecord(result.data, 'SQL job response');
  if (data.name !== name) throw new Error('SQL job response has an unexpected resource name.');
  const state = typeof data.state === 'number' ? JOB_STATES[data.state] : data.state;
  if (typeof state !== 'string' || !JOB_STATES.some((value) => value === state)) {
    throw new Error(`SQL job ${name} has an unsupported state.`);
  }
  return { ok: true, data: { ...data, name, state } };
}
