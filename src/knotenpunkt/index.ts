import { env } from '@/env';
import { z } from 'zod';
import { knotenpunktLlmModelSchema } from './schema';

export async function fetchLlmModels({ apiKey }: { apiKey: string }) {
  const response = await fetch(`${env.apiUrl}/v1/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw Error('Could not fetch the llm models');
  }

  const json = await response.json();
  const models = z.array(knotenpunktLlmModelSchema).parse(json);

  return models;
}
