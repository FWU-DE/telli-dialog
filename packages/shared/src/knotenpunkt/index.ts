import { z } from 'zod';
import { knotenpunktLlmModelSchema } from './schema';

export async function fetchLlmModels({ apiKey }: { apiKey: string }) {
  const response = await fetch(`${process.env.apiUrl}/v1/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    // Todo RL: Does not exist
    //    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw Error('Could not fetch the llm models');
  }

  const json = await response.json();
  const models = z.array(knotenpunktLlmModelSchema).parse(json);

  return models;
}
