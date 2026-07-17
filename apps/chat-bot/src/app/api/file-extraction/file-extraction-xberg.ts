import { z } from 'zod';
import { env } from '@/env';

const xbergResultSchema = z.object({
  content: z.string(),
});

// The xberg service historically returned a top-level array of results, and now
// returns an object with a `results` key. Support both, normalizing to the new shape.
const xbergResponseSchema = z.union([
  z.array(xbergResultSchema).transform((results) => ({ results })),
  z.object({ results: z.array(xbergResultSchema) }),
]);

/**
 * Extracts text from a file as Markdown using the xberg-io extraction service.
 * Throws an Exception when extraction fails.
 */
export async function fileExtractionXberg({
  buffer,
  filename,
}: {
  buffer: Buffer;
  filename: string;
}): Promise<string> {
  try {
    const timeout = 30_000;

    const formData = new FormData();
    formData.append('files', new Blob([buffer as BlobPart]), filename);
    formData.append('output_format', 'markdown');

    const response = await fetch(new URL('/extract', env.xbergUrl), {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      throw new Error(`Xberg request failed with status ${response.status} for file: ${filename}`);
    }

    const json = await response.json();
    const { results } = xbergResponseSchema.parse(json);

    const markdown = results[0]?.content?.trim() ?? '';

    if (!markdown) {
      throw new Error(`Xberg returned no content for file: ${filename}`);
    }

    return markdown;
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      throw new Error(`Xberg request timed out for file: ${filename}`);
    }

    throw error;
  }
}
