import { logError } from '@shared/logging';
import { z } from 'zod';
import {
  MUNDO_DETAILS_URL_PREFIX,
  MUNDO_SEARCH_DESCRIPTION_LENGTH_LIMIT,
  MUNDO_SEARCH_ENDPOINT,
  MUNDO_SEARCH_RESULTS_LIMIT,
  MUNDO_SEARCH_TIMEOUT_MS,
  MUNDO_SEARCH_TITLE_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';

const mundoSearchTileSchema = z.object({
  identifier: z.string().nullish(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  learnResourceType: z.array(z.string()).nullish(),
  language: z.array(z.string()).nullish(),
  source: z
    .object({
      name: z.string().nullish(),
    })
    .nullish(),
});

const mundoSearchApiResponseSchema = z.object({
  tiles: z.array(mundoSearchTileSchema).nullish(),
});

type MundoSearchTile = z.infer<typeof mundoSearchTileSchema>;

export type MundoSearchResult = {
  title: string;
  description: string;
  resourceType: string[];
  language: string[];
  url: string;
  source: string;
};

function truncate(value: string | null | undefined, limit: number): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…` : trimmed;
}

function normalizeList(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => v?.trim()).filter((v): v is string => !!v && v.length > 0);
}

function formatElement(element: MundoSearchTile): MundoSearchResult | null {
  const identifier = element.identifier?.trim();
  if (!identifier) return null;

  return {
    title: truncate(element.title, MUNDO_SEARCH_TITLE_LENGTH_LIMIT),
    description: truncate(element.description, MUNDO_SEARCH_DESCRIPTION_LENGTH_LIMIT),
    resourceType: normalizeList(element.learnResourceType),
    language: normalizeList(element.language),
    url: `${MUNDO_DETAILS_URL_PREFIX}${identifier}`,
    source: element.source?.name?.trim() ?? '',
  };
}

export const MUNDO_CLASS_LEVELS = ['1-4', '5-10', '11-13'] as const;
export type MundoClassLevel = (typeof MUNDO_CLASS_LEVELS)[number];

function sanitizeClassLevel(value: string | undefined): MundoClassLevel | null {
  if (typeof value !== 'string') return null;
  return (MUNDO_CLASS_LEVELS as readonly string[]).includes(value)
    ? (value as MundoClassLevel)
    : null;
}

export async function mundoSearch({
  query,
  classLevel,
}: {
  query: string;
  classLevel?: string;
}): Promise<MundoSearchResult[]> {
  try {
    const filteredClassLevel = sanitizeClassLevel(classLevel);
    const filterClassLevels = filteredClassLevel ? [filteredClassLevel] : [];
    const response = await fetch(MUNDO_SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ search: query, filters: { classLevels: filterClassLevels } }),
      signal: AbortSignal.timeout(MUNDO_SEARCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      logError(`MUNDO search failed with status ${response.status}: ${response.statusText}`);
      return [];
    }

    const rawData: unknown = await response.json();
    const parsed = mundoSearchApiResponseSchema.safeParse(rawData);

    if (!parsed.success) {
      logError('MUNDO search response failed schema validation', parsed.error);
      return [];
    }

    const tiles = parsed.data.tiles ?? [];
    return tiles
      .map(formatElement)
      .filter((result): result is MundoSearchResult => result !== null)
      .slice(0, MUNDO_SEARCH_RESULTS_LIMIT);
  } catch (error) {
    logError('Error during MUNDO search', error);
    return [];
  }
}
