import { WebSource } from '@shared/db/types';

/**
 * Get a default error source for a web source
 * @param link - The link associated with the error source
 * @returns A default error source for a web source
 */
export function defaultErrorSource(link: string): WebSource {
  return {
    error: true,
    link: link,
  };
}
