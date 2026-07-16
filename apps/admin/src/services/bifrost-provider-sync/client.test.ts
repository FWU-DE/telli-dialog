import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BifrostProviderSyncError } from '@/types/bifrost-provider-sync-error';

const logError = vi.hoisted(() => vi.fn());

vi.mock('@shared/logging', () => ({
  logError,
}));

import { syncBifrostProvider } from './client';

describe('syncBifrostProvider', () => {
  beforeEach(() => {
    logError.mockClear();
  });

  it('redacts sensitive fields from failed Bifrost responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'failed',
            auth_credentials: {
              private_key: 'secret-key',
              client_email: 'test@example.com',
            },
            nested: [{ apiKey: 'secret-api-key' }],
          }),
          { status: 500 },
        ),
      ),
    );

    await expect(
      syncBifrostProvider('https://bifrost.example.com', {
        provider: 'vertex',
        keys: [],
      }),
    ).rejects.toBeInstanceOf(BifrostProviderSyncError);

    expect(logError).toHaveBeenCalledWith(
      'Bifrost provider sync request failed',
      undefined,
      expect.objectContaining({
        provider: 'vertex',
        status: 500,
        response: JSON.stringify({
          error: 'failed',
          auth_credentials: '[redacted]',
          nested: [{ apiKey: '[redacted]' }],
        }),
      }),
    );
  });

  it('omits non-JSON responses from logs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('plain text secret', { status: 500 })),
    );

    await expect(
      syncBifrostProvider('https://bifrost.example.com', {
        provider: 'vertex',
        keys: [],
      }),
    ).rejects.toBeInstanceOf(BifrostProviderSyncError);

    expect(logError).toHaveBeenCalledWith(
      'Bifrost provider sync request failed',
      undefined,
      expect.objectContaining({
        response: '[non-JSON response omitted]',
      }),
    );
  });
});
