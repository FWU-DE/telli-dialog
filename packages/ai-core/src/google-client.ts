import type { LlmModel } from '@ais-chat/api-database';
import { GoogleAuth } from 'google-auth-library';
import { ProviderConfigurationError } from './errors';

export interface GoogleClientConfig {
  projectId: string;
  location: string;
  auth: GoogleAuth;
}

const googleClientCache = new Map<string, GoogleClientConfig>();

export function createGoogleClient(model: LlmModel): GoogleClientConfig {
  if (model.setting.provider !== 'google') {
    throw new ProviderConfigurationError('Invalid model configuration for Google');
  }

  const { projectId, location } = model.setting;
  const cacheKey = `${projectId}-${location}` as const;

  const cachedClient = googleClientCache.get(cacheKey);
  if (cachedClient) {
    return cachedClient;
  }

  const client = {
    projectId,
    location,
    auth: new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    }),
  };

  googleClientCache.set(cacheKey, client);

  return client;
}

export async function getGoogleAccessToken(auth: GoogleAuth): Promise<string> {
  const accessToken = await auth.getAccessToken();

  if (!accessToken) {
    throw new ProviderConfigurationError('Failed to resolve Google access token');
  }

  return accessToken;
}

export function getGoogleServiceAddress(location: string): string {
  // Depending on the type of location (regional, multi-regional, or global), the endpoint format differs
  switch (location) {
    case 'europe-west1':
      return `${location}-aiplatform.googleapis.com`;
    case 'eu':
      return `aiplatform.${location}.rep.googleapis.com`;
    default:
    case 'global':
      return 'aiplatform.googleapis.com';
  }
}
