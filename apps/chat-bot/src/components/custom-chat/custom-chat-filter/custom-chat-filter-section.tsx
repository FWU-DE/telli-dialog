'use client';

import { Card, CardRow } from '@ui/components/card';
import { MultipleSelectDropdown } from '@ui/components/multiple-select-dropdown';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  CATEGORY_KEYS,
  FEDERAL_STATE_KEYS,
  GRADE_RANGE_KEYS,
  LANGUAGE_KEYS,
  SCHOOL_TYPE_KEYS,
  SUBJECT_GROUPS,
} from './custom-chat-filter-keys';
import { CustomChatHeading2 } from '../custom-chat-heading2';

type CustomFilterSectionProps = Record<string, never>;

export default function CustomFilterSection({}: CustomFilterSectionProps) {
  const t = useTranslations();
  const [schoolType, setSchoolType] = useState<string[]>([]);
  const [gradeRange, setGradeRange] = useState<string[]>([]);
  const [subject, setSubject] = useState<string[]>([]);
  const [category, setCategory] = useState<string[]>([]);
  const [federalState, setFederalState] = useState<string[]>([]);
  const [language, setLanguage] = useState<string[]>([]);

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
    options: group.translationKeys.map((translationKey) => ({
      value: translationKey.replace(/^[^.]+\./, ''),
      label: t(translationKey),
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
            value={schoolType}
            onValueChange={setSchoolType}
            optionGroups={[{ options: schoolTypeOptions }]}
            placeholder={selectPlaceholder}
            testId="filter-school-type-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
          <MultipleSelectDropdown
            label={t('filter.grade-filter')}
            value={gradeRange}
            onValueChange={setGradeRange}
            optionGroups={[{ options: gradeRangeOptions }]}
            placeholder={selectPlaceholder}
            testId="filter-grade-range-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
          <MultipleSelectDropdown
            label={t('filter.subject-filter')}
            value={subject}
            onValueChange={setSubject}
            optionGroups={subjectOptions}
            placeholder={selectPlaceholder}
            testId="filter-subject-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
          <MultipleSelectDropdown
            label={t('filter.category-filter')}
            value={category}
            onValueChange={setCategory}
            optionGroups={[{ options: categoryOptions }]}
            placeholder={selectPlaceholder}
            testId="filter-category-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
          <MultipleSelectDropdown
            label={t('filter.federal-state-filter')}
            value={federalState}
            onValueChange={setFederalState}
            optionGroups={[{ options: federalStateOptions }]}
            placeholder={selectPlaceholder}
            testId="filter-federal-state-select"
            selectedCountLabel={(count) => t('filter.selected-count', { count })}
          />
          <MultipleSelectDropdown
            label={t('filter.language-filter')}
            value={language}
            onValueChange={setLanguage}
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
