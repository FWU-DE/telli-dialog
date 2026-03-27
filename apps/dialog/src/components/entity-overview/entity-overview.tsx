'use client';

import React from 'react';
import { OverviewFilter } from '@shared/overview-filter';
import { useTranslations } from 'next-intl';
import { Input } from '@telli/ui/components/Input';
import { MagnifyingGlassIcon, InfoIcon } from '@phosphor-icons/react';
import { useFederalState } from '@/components/providers/federal-state-provider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@telli/ui/components/Tooltip';
import { FilterTabs } from '@telli/ui/components/FilterTabs';

type EntityOverviewProps = {
  title: string;
  infoTooltip: string;
  searchPlaceholder: string;
  createButton: React.ReactNode;
  activeFilter: OverviewFilter;
  onFilterChange: (filter: OverviewFilter) => void;
  children: (searchQuery: string) => React.ReactNode;
  itemCount: number;
};

const FILTER_OPTIONS: OverviewFilter[] = ['all', 'mine', 'official', 'school'];

export default function EntityOverview({
  title,
  infoTooltip,
  searchPlaceholder,
  createButton,
  activeFilter,
  onFilterChange,
  children,
  itemCount,
}: EntityOverviewProps) {
  const [searchInput, setSearchInput] = React.useState('');
  const federalState = useFederalState();
  const t = useTranslations('entity-overview');

  const showSchoolFilter = federalState?.featureToggles?.isShareTemplateWithSchoolEnabled ?? false;
  const filterDisabled = itemCount < 1;

  const visibleTabs = FILTER_OPTIONS.filter((f) => f !== 'school' || showSchoolFilter).map((f) => ({
    value: f,
    label: t(`filter-${f}`),
  }));

  return (
    <div className="min-w-full overflow-auto flex flex-col h-full bg-gray-50">
      <div className="px-6 pt-6 pb-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <h1 className="text-3xl">{title}</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                    aria-label={t('info-tooltip-label')}
                  >
                    <InfoIcon className="w-5 h-5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  <p>{infoTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex flex-wrap-reverse justify-between gap-2 mb-4">
            <div className="relative max-w-sm w-full">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                disabled={filterDisabled}
                aria-label={searchPlaceholder}
                className="h-10 rounded-xl border-gray-300 bg-white pr-10 pl-4 shadow-none focus-visible:border-gray-400 focus-visible:ring-0"
              />
              <MagnifyingGlassIcon
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
                aria-hidden="true"
              />
            </div>
            {createButton}
          </div>

          <FilterTabs
            tabs={visibleTabs}
            activeTab={activeFilter}
            onTabChange={onFilterChange}
            aria-label={t('filter-tabs-label')}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-4 pb-6">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex flex-col gap-2 w-full" role="tabpanel">
            {children(searchInput)}
          </div>
        </div>
      </div>
    </div>
  );
}
