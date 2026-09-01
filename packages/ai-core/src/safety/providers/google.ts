import type { SafetyCheckFn, SafetyResult, AiModel } from '../types';
import { GoogleAuth } from 'google-auth-library';
import { AiGenerationError, ProviderConfigurationError } from '../../errors';
import { getGoogleServiceAddress } from '../../google-client';

type GoogleModelSettings = Extract<AiModel['setting'], { provider: 'google' }>;

function getEndpointId(model: AiModel): string {
  const parameters = model.additionalParameters;
  const endpointId = parameters?.endpointId;
  if (typeof endpointId !== 'string' || endpointId === '') {
    throw new ProviderConfigurationError(
      `Google safety model ${model.name} requires additionalParameters.endpointId`,
    );
  }
  return endpointId;
}

function getEndpointHost(model: AiModel, location: string): string {
  const endpointHost = model.additionalParameters?.endpointHost;
  if (typeof endpointHost === 'string' && endpointHost !== '') {
    return endpointHost;
  }

  return getGoogleServiceAddress(location);
}

export function constructGoogleSafetyCheckFn(model: AiModel): SafetyCheckFn {
  if (model.setting.provider !== 'google') {
    throw new ProviderConfigurationError('Invalid model configuration for Google');
  }

  const settings = model.setting as GoogleModelSettings;
  const endpointId = getEndpointId(model);
  const endpointHost = getEndpointHost(model, settings.location);
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  return async function checkGoogleSafety({ text }): Promise<SafetyResult> {
    try {
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();
      if (!accessToken.token) {
        throw new Error('Google authentication returned no access token');
      }

      const response = await fetch(
        `https://${endpointHost}/v1/projects/${settings.projectId}/locations/${settings.location}/endpoints/${endpointId}:predict`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [
              {
                '@requestFormat': 'chatCompletions',
                messages: [{ role: 'user', content: text }],
                max_tokens: 100,
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const payload = (await response.json()) as {
        predictions?: { choices?: Array<{ message?: { content?: string } }> };
      };
      const result = payload.predictions?.choices?.[0]?.message?.content;
      if (!result) {
        throw new Error('Google safety model returned no result');
      }

      return { result };
    } catch (error) {
      throw new AiGenerationError(
        `Google Vertex AI Safety request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
}
