import { WebsearchSource } from '@/app/api/webpage-content/types';

/**
 * Get a default error source for a websearch source
 * @returns A default error source for a websearch source
 */
export function defaultErrorSource(): WebsearchSource {
  return {
    type: 'websearch',
    error: true,
    link: '',
  };
}
