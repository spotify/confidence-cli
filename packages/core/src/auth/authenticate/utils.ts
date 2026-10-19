import { SESSION_EXPIRED_ERR, MALFORMED_TOKEN_ERR } from './constants.js';

export function hasExpiredSession(err: unknown) {
  return (err as Error).cause === SESSION_EXPIRED_ERR;
}

export function hasMalformedToken(err: unknown) {
  return (err as Error).cause === MALFORMED_TOKEN_ERR;
}
