'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

export type FilterTabItem<T extends string> = {
  value: T;
  label: string;
};

type FilterTabsProps<T extends string> = {
  tabs: FilterTabItem<T>[];
  activeTab: T;
  onTabChange: (value: T) => void;
  'aria-label'?: string;
};

export function FilterTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  'aria-label': ariaLabel,
}: FilterTabsProps<T>) {
  return (
    <div className="flex gap-2 flex-wrap" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors border',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            activeTab === tab.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-white text-foreground border-gray-300 hover:bg-gray-100',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
