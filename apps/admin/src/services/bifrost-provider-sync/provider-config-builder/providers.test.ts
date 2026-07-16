import { describe, expect, it } from 'vitest';
import { buildVertexProviderConfigs } from './providers';

describe('buildVertexProviderConfigs', () => {
  it('groups vertex models by authCredentials', () => {
    const configs = buildVertexProviderConfigs([
      {
        id: 'model-0',
        provider: 'bifrost',
        name: 'claude-sonnet-4-6',
        displayName: 'Claude',
        description: '',
        setting: {
          provider: 'google',
          projectId: 'project-id',
          location: 'europe-west3',
        },
        priceMetadata: { type: 'text', completionTokenPrice: 1, promptTokenPrice: 1 },
        organizationId: 'org-1',
        createdAt: new Date(),
        supportedImageFormats: [],
        additionalParameters: {},
        isNew: false,
        isDeleted: false,
      },
      {
        id: 'model-1',
        provider: 'bifrost',
        name: 'gpt-5',
        displayName: 'GPT-5',
        description: '',
        setting: {
          provider: 'google',
          projectId: 'project-id',
          location: 'europe-west3',
          authCredentials: {
            type: 'service_account',
            client_email: 'test@example.com',
          },
        },
        priceMetadata: { type: 'text', completionTokenPrice: 1, promptTokenPrice: 1 },
        organizationId: 'org-1',
        createdAt: new Date(),
        supportedImageFormats: [],
        additionalParameters: {},
        isNew: false,
        isDeleted: false,
      },
    ] as never);

    expect(configs).toHaveLength(2);
    expect(configs[0]?.keys[0]?.name).toBe('vertex-project-id-europe-west3-2014fc08');
    expect(configs[0]?.keys[0]?.vertex_key_config?.auth_credentials).toBe('');
    expect(configs[0]?.keys[0]?.models).toEqual(['claude-sonnet-4-6']);
    expect(configs[1]?.keys[0]?.name).not.toBe('vertex-project-id-europe-west3-2014fc08');
    expect(configs[1]?.keys[0]?.vertex_key_config?.auth_credentials).toBe(
      JSON.stringify({
        client_email: 'test@example.com',
        type: 'service_account',
      }),
    );
    expect(configs[1]?.keys[0]?.models).toEqual(['gpt-5']);
  });
});
