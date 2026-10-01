/**
 * Identifies a pre-built token scaffold.
 *
 * Each variant writes token files that trigger a specific code path
 * in the wizard's authentication detection logic.
 *
 * - `'none'` — no tokens (clears any existing files)
 * - `'valid'` — valid JWT for `existing@example.com`, no refresh token
 * - `'with-refresh'` — valid JWT + refresh token (enables token refresh flow)
 */
export type TokenType = 'none' | 'valid' | 'with-refresh';
