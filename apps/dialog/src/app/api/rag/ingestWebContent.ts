import { dbChunksExistForSourceUrl, dbInsertWebChunks } from '@shared/db/functions/files';
import { webScraper } from '../webpage-content/search-web';
import { chunkAndEmbed } from './rag-service';

/**
 * Ingests web content for the given URLs if it doesn't already exist in the database.
 *
 * @param urls The list of URLs to ingest content from.
 * @param federalStateId - The federal state ID of the user
 * @returns The list of URLs that were processed (either already existed or were newly ingested).
 */
export async function ingestWebContentIfMissing({
  urls,
  federalStateId,
}: {
  urls: string[];
  federalStateId: string;
}): Promise<string[]> {
  const processedUrls: string[] = [];

  for (const url of urls) {
    const exists = await dbChunksExistForSourceUrl(url);
    if (!exists) {
      const source = await webScraper(url);

      if (!source.content || source.error) {
        continue;
      }

      const newChunks = await chunkAndEmbed({
        text: source.content,
        sourceUrl: source.link,
        sourceType: 'webpage',
        federalStateId,
      });

      await dbInsertWebChunks(newChunks);
    }
    processedUrls.push(url);
  }

  return processedUrls;
}
