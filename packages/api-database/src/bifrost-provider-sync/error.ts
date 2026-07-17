export const BIFROST_PROVIDER_SYNC_ERROR_CODE = 'BIFROST_PROVIDER_SYNC_FAILED';

export class BifrostProviderSyncError extends Error {
  constructor() {
    super(BIFROST_PROVIDER_SYNC_ERROR_CODE);
    this.name = 'BifrostProviderSyncError';
  }
}

export function isBifrostProviderSyncError(error: unknown): error is Error {
  return error instanceof Error && error.message === BIFROST_PROVIDER_SYNC_ERROR_CODE;
}
