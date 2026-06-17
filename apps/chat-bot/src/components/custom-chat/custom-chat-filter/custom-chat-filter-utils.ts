import {
  type FilterCategories,
  type SchoolType,
  type GradeRange,
  type Subject,
  type Category,
  type FederalState,
  type Language,
} from '@shared/db/schema';

export type FilterValues = {
  schoolTypes: string[];
  gradeRanges: string[];
  subjects: string[];
  categories: string[];
  federalStates: string[];
  languages: string[];
};

export const EMPTY_FILTER_VALUES: FilterValues = {
  schoolTypes: [],
  gradeRanges: [],
  subjects: [],
  categories: [],
  federalStates: [],
  languages: [],
};

type EntityWithFilterValues = {
  filterCategories?: {
    school_types?: string[];
    grade_ranges?: string[];
    subjects?: string[];
    categories?: string[];
    federal_states?: string[];
    languages?: string[];
  };
  schoolType?: string | null;
  gradeLevel?: string | null;
  subject?: string | null;
};

function unique(values: string[]): string[] {
  return values.filter((value, index, allValues) => allValues.indexOf(value) === index);
}

function matchesSelectedGroup(entityValues: string[], selectedValues: string[]): boolean {
  if (selectedValues.length === 0) {
    return true;
  }

  const entityValueSet = new Set(entityValues);
  return selectedValues.some((value) => entityValueSet.has(value));
}

export function hasActiveFilters(values: FilterValues): boolean {
  return Object.values(values).some((groupValues) => groupValues.length > 0);
}

export function matchesFilterValues(
  entityValues: FilterValues,
  selectedValues: FilterValues,
): boolean {
  return (
    matchesSelectedGroup(entityValues.schoolTypes, selectedValues.schoolTypes) &&
    matchesSelectedGroup(entityValues.gradeRanges, selectedValues.gradeRanges) &&
    matchesSelectedGroup(entityValues.subjects, selectedValues.subjects) &&
    matchesSelectedGroup(entityValues.categories, selectedValues.categories) &&
    matchesSelectedGroup(entityValues.federalStates, selectedValues.federalStates) &&
    matchesSelectedGroup(entityValues.languages, selectedValues.languages)
  );
}

export function extractFilterValues(entity: EntityWithFilterValues): FilterValues {
  const filterCategories = entity.filterCategories;
  const schoolTypes =
    filterCategories?.school_types && filterCategories.school_types.length > 0
      ? filterCategories.school_types
      : entity.schoolType
        ? [entity.schoolType]
        : [];

  const gradeRanges =
    filterCategories?.grade_ranges && filterCategories.grade_ranges.length > 0
      ? filterCategories.grade_ranges
      : entity.gradeLevel
        ? [entity.gradeLevel]
        : [];

  const subjects =
    filterCategories?.subjects && filterCategories.subjects.length > 0
      ? filterCategories.subjects
      : entity.subject
        ? [entity.subject]
        : [];

  return {
    schoolTypes: unique(schoolTypes),
    gradeRanges: unique(gradeRanges),
    subjects: unique(subjects),
    categories: unique(filterCategories?.categories ?? []),
    federalStates: unique(filterCategories?.federal_states ?? []),
    languages: unique(filterCategories?.languages ?? []),
  };
}

export function toFilterCategories(values: FilterValues): FilterCategories {
  return {
    school_types: unique(values.schoolTypes) as SchoolType[],
    grade_ranges: unique(values.gradeRanges) as GradeRange[],
    subjects: unique(values.subjects) as Subject[],
    categories: unique(values.categories) as Category[],
    federal_states: unique(values.federalStates) as FederalState[],
    languages: unique(values.languages) as Language[],
  };
}

export type ActiveFilterPill = {
  label: string;
  group: keyof FilterValues;
  value: string;
};

export function getActiveFilterPills(
  values: FilterValues,
  t: (key: string) => string,
): ActiveFilterPill[] {
  return [
    ...values.schoolTypes.map((value) => ({
      label: t(`school-types.${value}`),
      group: 'schoolTypes' as const,
      value,
    })),
    ...values.gradeRanges.map((value) => ({
      label: t(`grade-range.${value}`),
      group: 'gradeRanges' as const,
      value,
    })),
    ...values.subjects.map((value) => ({
      label: t(`subjects.${value}`),
      group: 'subjects' as const,
      value,
    })),
    ...values.categories.map((value) => ({
      label: t(`category.${value}`),
      group: 'categories' as const,
      value,
    })),
    ...values.federalStates.map((value) => ({
      label: t(`federal-states.${value}`),
      group: 'federalStates' as const,
      value,
    })),
    ...values.languages.map((value) => ({
      label: t(`languages.${value}`),
      group: 'languages' as const,
      value,
    })),
  ];
}

export function getActiveFilterPillLabels(
  values: FilterValues,
  t: (key: string) => string,
): string[] {
  return getActiveFilterPills(values, t).map((pill) => pill.label);
}
