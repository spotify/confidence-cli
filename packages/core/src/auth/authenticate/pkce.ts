import { randomBytes, createHash } from 'node:crypto';

function base64url(buf: Buffer): string {
  return buf.toString('base64url');
}

export function generatePKCE() {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}
