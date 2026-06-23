import {
  schoolTypesSchema,
  gradeRangesSchema,
  categoriesSchema,
  federalStatesSchema,
  languagesSchema,
  subjectsSchema,
  langSubjects,
  socialSciSubjects,
  artsSubjects,
  otherSubjects,
  stemSubjects,
  ethicsSubjects,
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
    values: langSubjects.options,
  },
  {
    titleKey: 'filter.subject-subgroup-social-sciences',
    values: socialSciSubjects.options,
  },
  {
    titleKey: 'filter.subject-subgroup-arts',
    values: artsSubjects.options,
  },
  {
    titleKey: 'filter.subject-subgroup-other',
    values: otherSubjects.options,
  },
  {
    titleKey: 'filter.subject-subgroup-stem',
    values: stemSubjects.options,
  },
  {
    titleKey: 'filter.subject-subgroup-ethics',
    values: ethicsSubjects.options,
  },
] as const;
