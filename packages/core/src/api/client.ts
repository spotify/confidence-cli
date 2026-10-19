import { env } from '../system/env.js';
import type { ApiResponse, ApiError, ApiRequestOptions, Region } from './types.js';

export function resolveBaseUrl(service: string, region: Region): string {
  const override = env('CONFIDENCE_API_BASE_URL');
  if (override) return override;

  const regionPrefix = region.toLowerCase();
  return `https://${service}.${regionPrefix}.confidence.dev`;
}

export async function apiRequest<T>(opts: ApiRequestOptions): Promise<ApiResponse<T>> {
  const { token, region, service, path, method = 'GET', body, params } = opts;
  const base = resolveBaseUrl(service, region);
  const url = new URL(path, base);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const timeout = AbortSignal.timeout(opts.timeoutMs ?? 30_000);
    const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
      redirect: opts.redirect,
    });

    // Read the body under the same deadline as fetch. Transport/body failures
    // belong to the outer catch; only JSON decoding failures are handled here.
    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        ok: false,
        status: response.status,
        error: {
          code: response.status,
          message: response.ok
            ? 'Invalid JSON response from API.'
            : response.statusText || `HTTP ${response.status}`,
        },
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: parseApiError(data) ?? {
          code: response.status,
          message: response.statusText || `HTTP ${response.status}`,
        },
      };
    }

    return { ok: true, data: data as T };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: {
        code: 0,
        message: `Network error: ${err instanceof Error ? err.message : 'Request failed'}`,
      },
    };
  }
}

function parseApiError(data: unknown): ApiError | undefined {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return;
  if (!('code' in data) || typeof data.code !== 'number' || !Number.isFinite(data.code)) return;
  if (!('message' in data) || typeof data.message !== 'string') return;

  return {
    code: data.code,
    message: data.message,
    ...('details' in data && Array.isArray(data.details) ? { details: data.details } : {}),
  };
}
