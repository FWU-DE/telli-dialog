'use client';

import React from 'react';
import { OverviewFilter, overviewFilterSchema } from '@shared/overview-filter';
import { useTranslations } from 'next-intl';
import { Input } from '@telli/ui/components/Input';
import { MagnifyingGlassIcon, InfoIcon, XCircleIcon } from '@phosphor-icons/react';
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
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClearSearch = () => {
    setSearchInput('');
    inputRef.current?.focus();
  };

  const showSchoolFilter = federalState?.featureToggles?.isShareTemplateWithSchoolEnabled ?? false;
  const filterDisabled = itemCount < 1;

  const visibleTabs = FILTER_OPTIONS.filter((f) => f !== 'school' || showSchoolFilter).map((f) => ({
    value: f,
    label: t(`filter-${f}`),
  }));

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeFilter]);

  return (
    <div className="min-w-full overflow-auto flex flex-col h-full bg-gray-50">
      <HeaderPortal className="bg-gray-50">
        <ToggleSidebarButton
          isNewUiDesignEnabled={federalState?.featureToggles?.isNewUiDesignEnabled ?? false}
        />
        <div className="grow"></div>
        <ProfileMenu userAndContext={user} />
      </HeaderPortal>
      <div className="overflow-auto" ref={scrollContainerRef}>
        <div className="px-6 pt-6 pb-0">
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
                  ref={inputRef}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={searchPlaceholder}
                  disabled={filterDisabled}
                  aria-label={searchPlaceholder}
                  className="h-10 rounded-xl border-gray-300 bg-card pr-10 pl-4 shadow-none focus-visible:border-gray-400 focus-visible:ring-0"
                />
                {searchInput ? (
                  <XCircleIcon
                    className="absolute right-3 top-1/2 size-5 -translate-y-2/3 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                    aria-hidden="true"
                    onClick={handleClearSearch}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleClearSearch();
                      }
                    }}
                  />
                ) : (
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-2/3 text-gray-500"
                    aria-hidden="true"
                  />
                )}
              </div>
              {createButton}
            </div>
          </div>
        </div>

        <div className="px-6 py-2 pb-4 sticky top-0 z-10 bg-gray-50">
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-end flex-wrap gap-2" aria-label={t('filter-tabs-label')}>
              <FilterTabs
                tabs={visibleTabs}
                activeTab={activeFilter}
                onTabChange={onFilterChange}
              />
              <div className="grow" />
              <div className="text-primary hover:text-primary-dark">
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
                    className="w-fit gap-1 border-0 bg-transparent shadow-none text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" position="popper">
                    <SelectItem value="date">{t('sort-date')}</SelectItem>
                    <SelectItem value="name">{t('sort-name')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-auto px-6 pb-6">
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex flex-col gap-2 w-full">{children(searchInput, sortBy)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
