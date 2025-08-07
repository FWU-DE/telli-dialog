import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';

export function createTelliConfiguration({
  apiKey,
  baseUrl,
}: {
  apiKey: string;
  baseUrl: string;
}): OpenAIProvider {
  return createOpenAI({ apiKey, baseURL: baseUrl });
}
