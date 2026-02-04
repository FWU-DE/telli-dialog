import { WebsearchSource } from '@shared/db/types';

/**
 * Get a default error source for a websearch source
 * @param link - The link associated with the error source
 * @returns A default error source for a websearch source
 */
export function defaultErrorSource(link: string): WebsearchSource {
  return {
    type: 'websearch',
    error: true,
    link: link,
  };
}
