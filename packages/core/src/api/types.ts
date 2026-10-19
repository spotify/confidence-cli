export type Region = 'EU' | 'US';

export type ApiError = {
  code: number;
  message: string;
  details?: unknown[];
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  status: number;
  error: ApiError;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type PaginatedList<T> = {
  items: T[];
  nextPageToken?: string;
};

export type ApiRequestOptions = {
  token: string;
  region: Region;
  service: string;
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string>;
  /** Cancels both the request and response body consumption. */
  signal?: AbortSignal;
  /** Redirect policy. Defaults to fetch's existing follow behavior. */
  redirect?: 'follow' | 'error';
  /** Overall deadline in milliseconds, including response body consumption. Defaults to 30 seconds. */
  timeoutMs?: number;
};
