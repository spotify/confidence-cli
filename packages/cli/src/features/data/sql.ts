import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import type { ApiResponse } from '@spotify-confidence/core';
import { getSqlJob, previewSqlQuery, type SqlJob } from '@network/metrics-sql.js';
import { requireRecord, requireString, resourcePath } from '@network/metrics-types.js';
import { executeDataRequest } from './request.js';

function previewInput(argv: Record<string, unknown>): string {
  const path = requireString(argv['from-file'], '--from-file');
  let input: unknown;
  try {
    input = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch {
    throw new Error(
      'Could not read SQL preview input. Supply a JSON file containing only "query".',
    );
  }
  const data = requireRecord(input, 'SQL preview input');
  if (Object.keys(data).some((key) => key !== 'query')) {
    throw new Error('SQL preview input accepts only "query".');
  }
  return requireString(data.query, 'query');
}

function timeoutMilliseconds(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 3600) {
    throw new Error('--timeout must be a positive number of seconds, at most 3600.');
  }
  return Math.max(1, Math.floor(value * 1000));
}

function waitFailure(name: string, message: string): ApiResponse<never> {
  return {
    ok: false,
    status: 0,
    error: {
      code: 0,
      message: `${message} Inspect ${name} with "data sql status". The CLI did not request cancellation.`,
    },
  };
}

export async function waitForSqlJob(options: {
  token: string;
  name: string;
  timeoutMs: number;
  signal?: AbortSignal;
}): Promise<ApiResponse<SqlJob>> {
  const { token, name, timeoutMs } = options;
  const deadline = Date.now() + timeoutMs;
  const signals = [AbortSignal.timeout(timeoutMs)];
  if (options.signal) signals.push(options.signal);
  const signal = AbortSignal.any(signals);

  try {
    while (!signal.aborted && Date.now() < deadline) {
      const result = await getSqlJob(token, name, {
        signal,
        timeoutMs: Math.max(1, Math.min(30_000, deadline - Date.now())),
      });
      if (!result.ok) {
        if (signal.aborted) break;
        return {
          ...result,
          error: {
            ...result.error,
            message: `${result.error.message} Inspect ${name} with "data sql status".`,
          },
        };
      }
      if (result.data.state === 'COMPLETED') return result;
      if (result.data.state === 'FAILED' || result.data.state === 'CANCELLED') {
        const failure = result.data.failedQueryResult;
        const detail =
          typeof failure === 'object' && failure !== null && 'error' in failure
            ? String(failure.error)
            : result.data.state;
        return waitFailure(name, `SQL job ${result.data.state.toLowerCase()}: ${detail}.`);
      }
      if (result.data.state === 'STATE_UNSPECIFIED') {
        return waitFailure(name, 'SQL job state is unspecified.');
      }
      await delay(Math.max(1, Math.min(1000, deadline - Date.now())), undefined, { signal });
    }
  } catch (error) {
    if (!signal.aborted) {
      return waitFailure(
        name,
        error instanceof Error ? error.message : 'Could not inspect SQL job.',
      );
    }
  }
  return waitFailure(name, options.signal?.aborted ? 'SQL wait cancelled.' : 'SQL wait timed out.');
}

export async function previewSql(argv: Record<string, unknown>): Promise<void> {
  const query = previewInput(argv);
  const timeoutMs = timeoutMilliseconds(argv.timeout ?? 60);
  const wait = argv.wait === true;
  await executeDataRequest(
    argv,
    async (token) => {
      const result = await previewSqlQuery(token, query);
      if (!result.ok || !wait) return result;
      return waitForSqlJob({ token, name: result.data.job, timeoutMs });
    },
    { dryRun: true, operation: 'sql.preview', query, wait, timeoutSeconds: timeoutMs / 1000 },
  );
}

export async function showSqlJob(argv: Record<string, unknown>): Promise<void> {
  const name = requireString(argv.name, '--name');
  resourcePath(name, 'sqlJobs');
  await executeDataRequest(argv, (token) => getSqlJob(token, name), {
    dryRun: true,
    operation: 'sql.status',
    name,
  });
}
