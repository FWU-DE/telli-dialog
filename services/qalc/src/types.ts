export const STATUSES = [
  'success',
  'invalid_input',
  'overload',
  'timeout',
  'crashed_worker',
  'malformed_output',
  'upstream_failure',
  'internal_failure',
] as const;

export type Status = (typeof STATUSES)[number];
export type Result = { status: Status; result?: string; error?: string };

export type Limits = {
  maxExpressionLength: number;
  maxBodyBytes: number;
  maxOutputBytes: number;
  wallTimeMs: number;
  concurrency: number;
};

export type RunOptions = { signal?: AbortSignal };
