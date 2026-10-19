import type { ApiResponse } from '@spotify-confidence/core';
import { metricsRequest } from './metrics.js';
import { requireRecord, requireString, resourcePath } from './metrics-types.js';

type Fields = Record<string, unknown>;

function resultArray(value: unknown, label: string): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value;
}

function optionalText(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`${label} must be a string.`);
  return value;
}

function schemaColumn(value: unknown): Fields {
  const column = requireRecord(value, 'Schema column');
  const name = requireString(column.name, 'Schema column.name');
  if (
    column.type !== undefined &&
    typeof column.type !== 'string' &&
    !Number.isInteger(column.type)
  ) {
    throw new Error('Schema column.type must be an enum name or integer.');
  }
  if (column.repeated !== undefined && typeof column.repeated !== 'boolean') {
    throw new Error('Schema column.repeated must be a boolean.');
  }
  return {
    name,
    ...(column.type === undefined ? {} : { type: column.type }),
    ...(column.repeated === undefined ? {} : { repeated: column.repeated }),
  };
}

function columnIssue(value: unknown): Fields {
  const issue = requireRecord(value, 'Column issue');
  const name = optionalText(issue.name, 'Column issue.name');
  const message = optionalText(issue.message, 'Column issue.message');
  return { ...(name === undefined ? {} : { name }), ...(message === undefined ? {} : { message }) };
}

function tableIssue(value: unknown): Fields {
  const issue = requireRecord(value, 'Table issue');
  const message = optionalText(issue.message, 'Table issue.message');
  if (
    issue.severity !== undefined &&
    typeof issue.severity !== 'string' &&
    !Number.isInteger(issue.severity)
  ) {
    throw new Error('Table issue.severity must be an enum name or integer.');
  }
  return {
    ...(message === undefined ? {} : { message }),
    ...(issue.severity === undefined ? {} : { severity: issue.severity }),
  };
}

/** Project only schema and warning fields. Never return the sample-row envelope. */
export async function getSqlSchema(token: string, name: string): Promise<ApiResponse<Fields>> {
  const path = resourcePath(name, 'sqlJobs');
  const result = await metricsRequest<unknown>(token, { path: `${path}/sampleRows` });
  if (!result.ok) return result;
  const sample = requireRecord(result.data, 'SQL schema response');
  if (sample.name !== name)
    throw new Error('SQL schema response.name does not match the requested job.');
  const keys = ['successfulQueryResult', 'failedQueryResult', 'pendingQueryResult'];
  if (keys.filter((key) => Object.hasOwn(sample, key)).length !== 1) {
    throw new Error('SQL schema response must contain exactly one query result.');
  }
  if (Object.hasOwn(sample, 'pendingQueryResult')) {
    requireRecord(sample.pendingQueryResult, 'Pending query result');
    return { ok: true, data: { name, state: 'PENDING', schema: null } };
  }
  if (Object.hasOwn(sample, 'failedQueryResult')) {
    const failure = requireRecord(sample.failedQueryResult, 'Failed query result');
    const error = optionalText(failure.error, 'Query failure.error') || 'Query failed.';
    const reason = optionalText(failure.reason, 'Query failure.reason');
    return {
      ok: true,
      data: {
        name,
        state: 'FAILED',
        schema: null,
        failedQueryResult: { error, ...(reason === undefined ? {} : { reason }) },
      },
    };
  }
  const success = requireRecord(sample.successfulQueryResult, 'Successful query result');
  return {
    ok: true,
    data: {
      name,
      state: 'COMPLETED',
      schema: resultArray(success.schema, 'Schema').map(schemaColumn),
      issues: resultArray(success.issues, 'Column issues').map(columnIssue),
      tableIssues: resultArray(success.tableIssues, 'Table issues').map(tableIssue),
    },
  };
}
