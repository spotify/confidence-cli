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

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: { code: 0, message: `Network error: ${(err as Error).message}` },
    };
  }

  if (!response.ok) {
    let apiError: ApiError;
    try {
      apiError = (await response.json()) as ApiError;
    } catch {
      apiError = { code: response.status, message: response.statusText };
    }
    return { ok: false, status: response.status, error: apiError };
  }

  const data = (await response.json()) as T;
  return { ok: true, data };
}
