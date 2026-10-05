import type { ApiFailure } from '@spotify-confidence/core';

export function formatApiError(result: ApiFailure): string {
  switch (result.status) {
    case 401:
      return 'Authentication expired. Run "confidence login" to re-authenticate.';
    case 403:
      return 'Permission denied. Check your workspace access.';
    case 409:
      return result.error.message || 'Resource already exists.';
    case 0:
      return result.error.message;
    default:
      return result.status >= 500
        ? 'Confidence API is unavailable. Try again later.'
        : result.error.message || `Request failed (${result.status}).`;
  }
}
