import type { WebSearchScope } from '@shared/db/schema';

/**
 * All entities have isWebSearchEnabled, but only characters and learning scenarios
 * have webSearchScope and webSearchIncludedDomains.
 * Therefore, we define two separate types and combine them into a union type for the form fields.
 */
export type WebSearchToggleFields = {
  isWebSearchEnabled: boolean;
};

export type WebSearchScopedFields = WebSearchToggleFields & {
  webSearchScope: WebSearchScope;
  webSearchIncludedDomains: string[];
};

export type WebSearchFields = WebSearchToggleFields | WebSearchScopedFields;
