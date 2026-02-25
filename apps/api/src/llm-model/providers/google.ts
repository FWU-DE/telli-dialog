import { GoogleAuth } from 'google-auth-library';
import OpenAI from 'openai';

import { LlmModel } from '@telli/api-database';
import { ImageGenerationFn } from '../types';

interface GoogleClientConfig {
  projectId: string;
  location: string;
  auth: GoogleAuth;
}

interface GoogleVertexPrediction {
  bytesBase64Encoded?: string;
}

interface GoogleVertexResponse {
  predictions?: GoogleVertexPrediction[];
}

export class GoogleProviderError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly details: unknown;

  constructor(message: string, status: number, statusText: string, details: unknown) {
    super(message);
    this.name = 'GoogleProviderError';
    this.status = status;
    this.statusText = statusText;
    this.details = details;
  }
}

// Cache Google client to avoid recreating auth instances
const googleClientCache = new Map<string, GoogleClientConfig>();

// Create or retrieve a cached Google client configuration
function createGoogleClient(model: LlmModel): GoogleClientConfig {
  if (model.setting.provider !== 'google') {
    throw new Error('Invalid model configuration for Google');
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
export function constructGoogleImageGenerationFn(model: LlmModel): ImageGenerationFn {
  const clientConfig = createGoogleClient(model);

  return async function getGoogleImageGeneration(params: Parameters<ImageGenerationFn>[0]) {
    const { projectId, location, auth } = clientConfig;

    // Get access token - GoogleAuth handles caching and refresh automatically
    const accessToken = await auth.getAccessToken();

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model.name}:predict`;

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

    if (!response.ok) {
      const errorDetails = await response.text();
      const error = new GoogleProviderError(
        `Google Vertex AI Image Generation failed: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText,
        errorDetails,
      );

      throw error;
    }

    const result = (await response.json()) as GoogleVertexResponse;

    // Convert Google's response to OpenAI format
    if (result.predictions && result.predictions.length > 0) {
      const prediction = result.predictions[0]!;

      if (!prediction.bytesBase64Encoded) {
        throw new Error('No image data received from Google Vertex AI');
      }

      const openAIResponse: OpenAI.Images.ImagesResponse = {
        created: Math.floor(Date.now() / 1000),
        data: [
          {
            b64_json: prediction.bytesBase64Encoded,
          },
        ],
      };

      return openAIResponse;
    } else {
      throw new Error('No image generated from Google Vertex AI');
    }
  };
}
