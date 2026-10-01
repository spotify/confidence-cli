type JsonEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export function formatJson<T>(data: T, meta?: Record<string, unknown>): string {
  const envelope: JsonEnvelope<T> = { data };
  if (meta && Object.keys(meta).length > 0) {
    envelope.meta = meta;
  }
  return JSON.stringify(envelope, null, 2);
}
