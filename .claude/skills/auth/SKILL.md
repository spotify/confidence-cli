---
name: auth
description: OAuth2 PKCE authentication flow with Confidence via Auth0
version: '0.2'
---

# Authentication Skill

Handles OAuth2 PKCE authentication with Confidence via Auth0.

## Flow

1. **Check existing credentials** — Look for persisted token at `$CONFIDENCE_CONFIG_DIR/credentials.json` (or `$TMPDIR/confidence_token` legacy path). Validate JWT expiry.
2. **Prompt user** — If valid token exists, offer to reuse or re-authenticate. If no token, ask whether to create a new account or sign in.
3. **Browser-based OAuth2 PKCE** — Start local HTTP server on port 8084, open browser to Auth0 authorize endpoint, wait for callback with authorization code.
4. **Token exchange** — Exchange authorization code + PKCE verifier for access token and refresh token.
5. **Persist tokens** — Write credentials to the config directory.
6. **Extract region** — Decode JWT payload, read `https://confidence.dev/region` claim (EU or US) to determine regional API endpoints.

## Auth0 Configuration

| Parameter          | Value                                 |
| ------------------ | ------------------------------------- |
| Domain             | `auth.confidence.dev`                 |
| Audience           | `https://confidence.dev/`             |
| Scope              | `openid profile email offline_access` |
| Client ID (signup) | `82qMvwZvqd3t3S0gRDvs8R53TehQXSJY`    |
| Client ID (login)  | `2fG3H4RhlAbIZm9Rfn32zTaILH7w1X4w`    |
| Callback port      | `8084`                                |
| Callback path      | `/callback`                           |

## Constraints

- **Never expose tokens, org IDs, JWT claims, or auth internals** to the user.
- **Port 8084** is fixed — kill any existing process on that port before starting the auth server.
- **Token validation** must check JWT expiry before each API call. Re-authenticate if expired.
- **Regional endpoints** are derived from the JWT region claim: `{service}.{eu|us}.confidence.dev` (flags, iam, resolver).
- **PKCE is required** — use S256 code challenge method with crypto-random verifier.
- All auth errors must be presented as plain-English messages, never raw API errors.

## Implementation

The auth flow is implemented in `packages/core/src/auth/authenticate.ts` using Node.js built-ins:

- `node:crypto` for PKCE code verifier/challenge generation
- `node:http` for local callback server
- `child_process.exec` for opening the browser (platform-aware)
- `fetch` for token exchange with Auth0
- JWT payload decoded manually (base64url) — no external JWT library needed

## Token Persistence

Tokens are stored in the Confidence config directory (`$CONFIDENCE_CONFIG_DIR` or `~/.config/confidence/`):

| File               | Content                                       |
| ------------------ | --------------------------------------------- |
| `credentials.json` | JWT access token, refresh token, organization |

The `CONFIDENCE_TOKEN` env var overrides persisted tokens when present.

## Remembered Workspace

On interactive **login** (never signup), the remembered organization is passed as the `organization` parameter to the Auth0 authorize endpoint so the workspace prompt is skipped. The `CONFIDENCE_ORGANIZATION` env var overrides the remembered value. If Auth0 returns an error on the callback while an organization was passed, the flow retries once without the `organization` parameter instead of failing.
