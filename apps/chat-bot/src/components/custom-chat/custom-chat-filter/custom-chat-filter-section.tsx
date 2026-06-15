'use client';

import { Card, CardRow } from '@ui/components/card';
import { MultipleSelectDropdown } from '@ui/components/multiple-select-dropdown';
import { useTranslations } from 'next-intl';
import {
  CATEGORY_KEYS,
  FEDERAL_STATE_KEYS,
  GRADE_RANGE_KEYS,
  LANGUAGE_KEYS,
  SCHOOL_TYPE_KEYS,
  SUBJECT_GROUPS,
} from '../filter-enum-keys';
import { CustomChatHeading2 } from '../custom-chat-heading2';

export type CustomFilterSectionValues = {
  schoolTypes: string[];
  gradeRanges: string[];
  subjects: string[];
  categories: string[];
  federalStates: string[];
  languages: string[];
};

type CustomFilterSectionProps = {
  values: CustomFilterSectionValues;
  onSchoolTypesChange: (values: string[]) => void;
  onGradeRangesChange: (values: string[]) => void;
  onSubjectsChange: (values: string[]) => void;
  onCategoriesChange: (values: string[]) => void;
  onFederalStatesChange: (values: string[]) => void;
  onLanguagesChange: (values: string[]) => void;
};

export default function CustomFilterSection({
  values,
  onSchoolTypesChange,
  onGradeRangesChange,
  onSubjectsChange,
  onCategoriesChange,
  onFederalStatesChange,
  onLanguagesChange,
}: CustomFilterSectionProps) {
  const t = useTranslations();

  const selectPlaceholder = t('common.please-select');

  const schoolTypeOptions = SCHOOL_TYPE_KEYS.map((key) => ({
    value: key,
    label: t(`school-types.${key}`),
  }));

  const gradeRangeOptions = GRADE_RANGE_KEYS.map((key) => ({
    value: key,
    label: t(`grade-range.${key}`),
  }));

  const categoryOptions = CATEGORY_KEYS.map((key) => ({
    value: key,
    label: t(`category.${key}`),
  }));

  const federalStateOptions = FEDERAL_STATE_KEYS.map((key) => ({
    value: key,
    label: t(`federal-states.${key}`),
  }));

  const languageOptions = LANGUAGE_KEYS.map((key) => ({
    value: key,
    label: t(`languages.${key}`),
  }));

  const subjectOptions = SUBJECT_GROUPS.map((group) => ({
    title: t(group.titleKey),
    options: group.values.map((value) => ({
      value,
      label: t(`subjects.${value}`),
    })),
  }));

  return (
    <div className="flex flex-col gap-3 mt-10" id="share-settings">
      <CustomChatHeading2
        text={t('filter.filter-attributes')}
        tooltip={t('filter.filter-tooltip')}
      />
      <Card>
        <CardRow className="grid grid-cols-1 gap-y-4 gap-x-8 md:grid-cols-2 lg:grid-cols-3">
          <MultipleSelectDropdown
            label={t('filter.school-filter')}
            value={values.schoolTypes}
            onValueChange={onSchoolTypesChange}
            optionGroups={[{ options: schoolTypeOptions }]}
            placeholder={selectPlaceholder}
            testId="filter-school-type-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
          <MultipleSelectDropdown
            label={t('filter.grade-filter')}
            value={values.gradeRanges}
            onValueChange={onGradeRangesChange}
            optionGroups={[{ options: gradeRangeOptions }]}
            placeholder={selectPlaceholder}
            testId="filter-grade-range-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
          <MultipleSelectDropdown
            label={t('filter.subject-filter')}
            value={values.subjects}
            onValueChange={onSubjectsChange}
            optionGroups={subjectOptions}
            placeholder={selectPlaceholder}
            testId="filter-subject-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
          <MultipleSelectDropdown
            label={t('filter.category-filter')}
            value={values.categories}
            onValueChange={onCategoriesChange}
            optionGroups={[{ options: categoryOptions }]}
            placeholder={selectPlaceholder}
            testId="filter-category-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
          <MultipleSelectDropdown
            label={t('filter.federal-state-filter')}
            value={values.federalStates}
            onValueChange={onFederalStatesChange}
            optionGroups={[{ options: federalStateOptions }]}
            placeholder={selectPlaceholder}
            testId="filter-federal-state-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
          <MultipleSelectDropdown
            label={t('filter.language-filter')}
            value={values.languages}
            onValueChange={onLanguagesChange}
            optionGroups={[{ options: languageOptions }]}
            placeholder={selectPlaceholder}
            testId="filter-language-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
        </CardRow>
      </Card>
    </div>
  );
}
