import type { ApiFailure } from '@spotify-confidence/core';
import { fail } from '@output/index.js';

/** Render only the API message, not arbitrary response bodies or error details. */
export function printApiError(failure: ApiFailure): void {
  const message = failure.error.message
    .replace(/Bearer\s+\S+/giu, 'Bearer [redacted]')
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .trim();
  fail(message || `API request failed (HTTP ${failure.status}).`);
}
