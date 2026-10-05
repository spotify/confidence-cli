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
};
