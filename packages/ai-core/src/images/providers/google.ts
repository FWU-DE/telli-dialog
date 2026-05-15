import * as Sentry from '@sentry/core';
import { GoogleAuth } from 'google-auth-library';
import type { AiModel, ImageGenerationFn } from '../types';
import { AiGenerationError, ProviderConfigurationError, ResponsibleAIError } from '../../errors';

interface GoogleClientConfig {
  projectId: string;
  location: string;
  auth: GoogleAuth;
}

interface GoogleVertexPrediction {
  raiFilteredReason?: string;
  bytesBase64Encoded?: string;
}

interface GoogleVertexResponse {
  predictions?: GoogleVertexPrediction[];
}

// Cache Google client to avoid recreating auth instances
const googleClientCache = new Map<string, GoogleClientConfig>();

// Create or retrieve a cached Google client configuration
function createGoogleClient(model: AiModel): GoogleClientConfig {
  if (model.setting.provider !== 'google') {
    throw new ProviderConfigurationError('Invalid model configuration for Google');
  }

  const { projectId, location } = model.setting;
  const cacheKey = `${projectId}-${location}` as const;

  if (googleClientCache.has(cacheKey)) {
    return googleClientCache.get(cacheKey)!;
  }

  // Initialize Google Auth with automatic credential detection
  // The GOOGLE_APPLICATION_CREDENTIALS env var should point to the service account JSON file
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = {
    projectId,
    location,
    auth,
  };

  googleClientCache.set(cacheKey, client);

  return client;
}

// Construct the Image Generation function for Google Vertex AI
export function constructGoogleImageGenerationFn(model: AiModel): ImageGenerationFn {
  const clientConfig = createGoogleClient(model);

  return async function getGoogleImageGeneration(params: Parameters<ImageGenerationFn>[0]) {
    const { projectId, location, auth } = clientConfig;
    const address = `${location}-aiplatform.googleapis.com`;
    const endpoint = `https://${address}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model.name}:predict`;

    return Sentry.startSpan(
      {
        name: `generate_image ${model.name}`,
        op: 'gen_ai.generate_image',
        attributes: {
          'gen_ai.operation.name': 'generate_image',
          'gen_ai.system': 'google_vertex_ai',
          'gen_ai.request.model': model.name,
          'http.request.method': 'POST',
          'server.address': address,
          'url.full': endpoint,
        },
      },
      async (span) => {
        try {
          // Get access token - GoogleAuth handles caching and refresh automatically
          const accessToken = await auth.getAccessToken();

          // Prepare the request for Vertex AI Image Generation
          const requestBody = {
            instances: [
              {
                prompt: params.prompt,
              },
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: '1:1',
              sampleImageSize: '1K',
              safetySetting: 'block_only_high',
              personGeneration: 'allow_adult',
              language: 'auto',
            },
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          span.setAttribute('http.response.status_code', response.status);

          if (!response.ok) {
            const errorDetails = await response.text();
            throw new AiGenerationError(
              `Google Vertex AI Image Generation request failed with status ${response.status}: ${response.statusText} \n\n ${errorDetails}`,
            );
          }

          const result = (await response.json()) as GoogleVertexResponse;

          // Convert Google's response to general Format
          if (result.predictions && result.predictions.length > 0) {
            const prediction = result.predictions[0]!;

            if (prediction.raiFilteredReason) {
              span.setAttribute('gen_ai.response.finish_reasons', [prediction.raiFilteredReason]);
              throw new ResponsibleAIError(
                `Image generation was blocked due to safety settings: ${prediction.raiFilteredReason}`,
              );
            }

            if (!prediction.bytesBase64Encoded) {
              throw new AiGenerationError('No image data received from Google Vertex AI');
            }

            span.setAttribute('gen_ai.response.finish_reasons', ['success']);
            span.setAttribute('gen_ai.response.model', model.name);
            return { data: [prediction.bytesBase64Encoded], output_format: 'png' };
          }

          throw new AiGenerationError('No image generated from Google Vertex AI');
        } catch (error) {
          span.setAttribute('error', true);
          throw error;
        }
      },
    );
  };
}
