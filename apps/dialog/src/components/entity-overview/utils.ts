export const VALID_SORT_OPTIONS = ['date-desc', 'date-asc', 'name-asc', 'name-desc'] as const;

export type SortOption = (typeof VALID_SORT_OPTIONS)[number];

type SortableEntity = {
  name: string;
  updatedAt: Date;
};

export function isSortOption(value: string): value is SortOption {
  return (VALID_SORT_OPTIONS as readonly string[]).includes(value);
}

export function filterAndSortEntities<T extends SortableEntity>(
  entities: T[],
  searchQuery: string,
  sortBy: SortOption,
): T[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEntities = normalizedQuery
    ? entities.filter((entity) => entity.name.toLowerCase().includes(normalizedQuery)).slice()
    : entities.slice();

  filteredEntities.sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'date-asc':
        return a.updatedAt.getTime() - b.updatedAt.getTime();
      case 'date-desc':
      default:
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  });

  return filteredEntities;
}
