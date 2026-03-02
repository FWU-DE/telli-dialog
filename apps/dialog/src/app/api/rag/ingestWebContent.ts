import { dbChunksExistForSourceUrl, dbInsertWebChunks } from '@shared/db/functions/files';
import { webScraper } from '../webpage-content/search-web';
import { chunkAndEmbed } from './rag-service';

/**
 * Ingests web content for the given URLs if it doesn't already exist in the database.
 *
 * @param urls The list of URLs to ingest content from.
 * @param federalStateId - The federal state ID of the user
 * @returns The list of URLs that were processed (either already existed or were newly ingested)
 * and the list of URLs that encountered errors.
 */
export async function ingestWebContent({
  urls,
  federalStateId,
}: {
  urls: string[];
  federalStateId: string;
}): Promise<{ processedUrls: string[]; errorUrls: string[] }> {
  // check which urls have already been ingested
  const existenceChecks = await Promise.all(
    urls.map(async (url) => ({ url, exists: await dbChunksExistForSourceUrl(url) })),
  );
  const newUrls = existenceChecks.filter((r) => !r.exists).map((r) => r.url);

  if (newUrls.length === 0) {
    return { processedUrls: urls, errorUrls: [] };
  }

  // scrape web content for new urls
  const scraped = await Promise.all(
    newUrls.map(async (url) => ({ url, source: await webScraper(url) })),
  );
  const successfulScrapes = scraped.filter((r) => r.source.content && !r.source.error);
  const errorUrls = scraped.filter((r) => !r.source.content || r.source.error).map((r) => r.url);

  // chunk and embed
  const embedded = await Promise.all(
    successfulScrapes.map(async (r) => ({
      url: r.url,
      chunks: await chunkAndEmbed({
        text: r.source.content!,
        sourceUrl: r.source.link,
        sourceType: 'webpage',
        federalStateId,
      }),
    })),
  );

  // insert into DB
  await dbInsertWebChunks(embedded.flatMap((r) => r.chunks));

  const processedUrls = [
    ...existenceChecks.filter((r) => r.exists).map((r) => r.url),
    ...embedded.map((r) => r.url),
  ];

  return { processedUrls, errorUrls };
}
