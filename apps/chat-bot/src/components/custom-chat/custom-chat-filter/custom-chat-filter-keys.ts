import {
  schoolTypesSchema,
  gradeRangesSchema,
  categoriesSchema,
  federalStatesSchema,
  languagesSchema,
  subjectsSchema,
} from '@shared/db/schema';

export const SCHOOL_TYPE_KEYS = Object.values(schoolTypesSchema.enum);
export const GRADE_RANGE_KEYS = Object.values(gradeRangesSchema.enum);
export const CATEGORY_KEYS = Object.values(categoriesSchema.enum);
export const FEDERAL_STATE_KEYS = Object.values(federalStatesSchema.enum);
export const LANGUAGE_KEYS = Object.values(languagesSchema.enum);
export const SUBJECT_KEYS = Object.values(subjectsSchema.enum);

export const SUBJECT_SUBGROUPS = [
  {
    titleKey: 'filter.subject-subgroup-languages',
    values: [
      'german',
      'english',
      'french',
      'greek',
      'italian',
      'latin',
      'russian',
      'spanish',
      'turkish',
      'german-as-second-language',
    ] as const,
  },
  {
    titleKey: 'filter.subject-subgroup-social-sciences',
    values: ['geography', 'history', 'politics', 'economics'] as const,
  },
  {
    titleKey: 'filter.subject-subgroup-arts',
    values: ['art', 'music', 'sports'] as const,
  },
  {
    titleKey: 'filter.subject-subgroup-other',
    values: [
      'business-studies',
      'health',
      'intercultural-education',
      'media-education',
      'education',
      'psychology',
      'addiction-prevention',
      'comprehensive-subjects',
      'traffic-education',
    ] as const,
  },
  {
    titleKey: 'filter.subject-subgroup-stem',
    values: [
      'biology',
      'chemistry',
      'informatics',
      'mathematics',
      'physics',
      'social-studies',
      'environmental-studies',
    ] as const,
  },
  {
    titleKey: 'filter.subject-subgroup-ethics',
    values: ['ethics', 'philosophy', 'religion'] as const,
  },
] as const;
