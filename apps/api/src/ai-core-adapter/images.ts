import { generateImageByNameWithBilling } from '@telli/ai-core';
import type OpenAI from 'openai';

/**
 * Generates an image using ai-core and returns an OpenAI-compatible ImagesResponse.
 */
export async function createImage({
  modelName,
  prompt,
  apiKeyId,
}: {
  modelName: string;
  prompt: string;
  apiKeyId: string;
}): Promise<OpenAI.Images.ImagesResponse> {
  const result = await generateImageByNameWithBilling(modelName, prompt, apiKeyId);

  return {
    created: Math.floor(Date.now() / 1000),
    data: result.data.map((b64) => ({
      b64_json: b64,
      revised_prompt: undefined,
      url: undefined,
    })),
  };
}
