import type { WebSearchScope } from '@shared/db/schema';

/**
 * All entities have isWebSearchEnabled, but only characters and learning scenarios
 * have webSearchScope and webSearchIncludedDomains.
 * Therefore, we define a type that includes all three fields, but make the latter two optional.
 */
export type WebSearchFields = {
  isWebSearchEnabled: boolean;
  webSearchScope?: WebSearchScope;
  webSearchIncludedDomains?: string[];
};
