import type { JsonObject } from '@spotify-confidence/shared-kernel';

type JsonEnvelope<T> = {
  data: T;
  meta?: JsonObject;
};

export function formatJson<T>(data: T, meta?: JsonObject): string {
  const envelope: JsonEnvelope<T> = { data };
  if (meta && Object.keys(meta).length > 0) {
    envelope.meta = meta;
  }
  return JSON.stringify(envelope, null, 2);
}
