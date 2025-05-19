import { createOpenAI } from '@ai-sdk/openai';

export function createTelliConfiguration({ apiKey, baseUrl }: { apiKey: string; baseUrl: string }) {
  return createOpenAI({ apiKey, baseURL: baseUrl });
}
