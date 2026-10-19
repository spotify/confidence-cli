import {
  apiRequest,
  extractRegion,
  type ApiRequestOptions,
  type ApiResponse,
} from '@spotify-confidence/core';

/** Send one authenticated request to the token's regional Metrics API. */
export async function metricsRequest<T>(
  token: string,
  options: Omit<ApiRequestOptions, 'token' | 'region' | 'service'>,
): Promise<ApiResponse<T>> {
  // Accept API paths, never absolute URLs or response-supplied pagination URLs.
  if (
    !options.path.startsWith('/v1/') ||
    /[\\%?#\s]/u.test(options.path) ||
    options.path.split('/').some((part) => part === '.' || part === '..')
  ) {
    throw new Error('Metrics requests require a local /v1/ API path.');
  }

  return apiRequest<T>({
    ...options,
    token,
    region: extractRegion(token),
    service: 'metrics',
    // Redirects could replay writes or send credentials to an API-supplied URL.
    redirect: 'error',
  });
}
