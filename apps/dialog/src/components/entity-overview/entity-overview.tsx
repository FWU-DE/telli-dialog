'use client';

import React from 'react';
import { OverviewFilter, overviewFilterSchema } from '@shared/overview-filter';
import { useTranslations } from 'next-intl';
import { Input } from '@telli/ui/components/Input';
import { MagnifyingGlassIcon, InfoIcon } from '@phosphor-icons/react';
import { useFederalState } from '@/components/providers/federal-state-provider';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@telli/ui/components/Dialog';
import { Button } from '@telli/ui/components/Button';
import { FilterTabs } from '@telli/ui/components/FilterTabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@telli/ui/components/Select';
import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import ProfileMenu from '../navigation/profile-menu';
import { ToggleSidebarButton } from '../navigation/sidebar/collapsible-sidebar';
import { useSession } from 'next-auth/react';

const VALID_SORT_OPTIONS = ['name', 'date'] as const;
export type SortOption = (typeof VALID_SORT_OPTIONS)[number];

type EntityOverviewProps = {
  title: string;
  infoTooltip: React.ReactNode;
  searchPlaceholder: string;
  createButton: React.ReactNode;
  activeFilter: OverviewFilter;
  onFilterChange: (filter: OverviewFilter) => void;
  children: (searchQuery: string, sortBy: SortOption) => React.ReactNode;
  itemCount: number;
};

const FILTER_OPTIONS = overviewFilterSchema.options;

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
  const [sortBy, setSortBy] = React.useState<SortOption>('date');
  const [infoDialogOpen, setInfoDialogOpen] = React.useState(false);
  const federalState = useFederalState();
  const { data: session } = useSession();
  const user = session?.user;
  const t = useTranslations('entity-overview');

  const showSchoolFilter = federalState?.featureToggles?.isShareTemplateWithSchoolEnabled ?? false;
  const filterDisabled = itemCount < 1;

  const visibleTabs = FILTER_OPTIONS.filter((f) => f !== 'school' || showSchoolFilter).map((f) => ({
    value: f,
    label: t(`filter-${f}`),
  }));

  return (
    <div className="min-w-full overflow-auto flex flex-col h-full bg-gray-50">
      <HeaderPortal className="bg-gray-50">
        <ToggleSidebarButton
          isNewUiDesignEnabled={federalState?.featureToggles?.isNewUiDesignEnabled ?? false}
        />
        <div className="grow"></div>
        <ProfileMenu userAndContext={user} />
      </HeaderPortal>
      <div className="px-6 pt-6 pb-2 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <h1 className="text-3xl">{title}</h1>
            <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-primary hover:text-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                  aria-label={t('info-tooltip-label')}
                >
                  <InfoIcon className="w-8 h-8" aria-hidden="true" />
                </button>
              </DialogTrigger>
              <DialogContent showCloseButton={false}>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription asChild>
                  <div>{infoTooltip}</div>
                </DialogDescription>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>{t('close')}</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-2/3 text-gray-500"
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

      <div className="max-w-3xl mx-auto w-full flex justify-end">
        <Select
          value={sortBy}
          onValueChange={(v) => {
            if (VALID_SORT_OPTIONS.includes(v as SortOption)) {
              setSortBy(v as SortOption);
            }
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-fit gap-1 border-0 bg-transparent shadow-none text-sm text-primary hover:text-primary-dark"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" position="popper">
            <SelectItem value="date">{t('sort-date')}</SelectItem>
            <SelectItem value="name">{t('sort-name')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-2 pb-6">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex flex-col gap-2 w-full">{children(searchInput, sortBy)}</div>
        </div>
      </div>
    </div>
  );
}
