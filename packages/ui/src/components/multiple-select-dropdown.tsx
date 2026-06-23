'use client';

import { CaretDownIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { Checkbox } from './checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu';
import { Field, FieldLabel } from './field';

export type MultipleSelectDropdownoptionGroups = {
  title?: string;
  options: Array<{ value: string; label: string }>;
};

type MultipleSelectDropdownProps = {
  label: string;
  tooltip?: string;
  value: string[];
  onValueChange: (values: string[]) => void;
  optionGroups: MultipleSelectDropdownoptionGroups[];
  placeholder?: string;
  testId: string;
  selectedCountLabel?: (count: number) => string;
  contentClassName?: string;
};

export function MultipleSelectDropdown({
  label,
  tooltip,
  value,
  onValueChange,
  optionGroups,
  placeholder,
  testId,
  selectedCountLabel,
  contentClassName,
}: MultipleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const options = useMemo(() => optionGroups.flatMap((group) => group.options), [optionGroups]);

  const selectedLabel = useMemo(() => {
    if (value.length === 0) {
      return placeholder;
    }

    if (value.length === 1) {
      const option = options.find((item) => item.value === value[0]);
      return option?.label ?? placeholder;
    }

    return selectedCountLabel?.(value.length) ?? String(value.length);
  }, [options, placeholder, selectedCountLabel, value]);

  const toggleValue = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onValueChange(value.filter((selectedValue) => selectedValue !== optionValue));
      return;
    }

    onValueChange([...value, optionValue]);
  };

  return (
    <Field>
      <FieldLabel tooltip={tooltip}>{label}</FieldLabel>
      <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
            }
          }}
          aria-label={label}
          data-testid={testId}
          className="border-input hover:border-primary/60 focus-visible:border-ring focus-visible:ring-ring/50 flex h-8 w-full items-center justify-between rounded-lg border bg-transparent px-2.5 text-left text-sm outline-none focus-visible:ring-3"
        >
          <span className="truncate text-muted-foreground">{selectedLabel}</span>
          <CaretDownIcon className="text-muted-foreground size-4 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className={[
            'z-300 rounded-enterprise-md border border-gray-200 bg-white p-4 shadow-dropdown w-auto max-w-[calc(100vw-2rem)] scrollbar-gutter-stable',
            contentClassName,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-4 pr-2">
            {optionGroups.map((group) => (
              <div key={group.title ?? group.options.map((item) => item.value).join('-')}>
                {group.title && (
                  <p className="mb-2 wrap-break-word bg-gray-100 px-2 py-1 text-[10px] font-semibold tracking-[0.2em] text-gray-500 uppercase">
                    {group.title}
                  </p>
                )}
                <ul className="space-y-2">
                  {group.options.map((option) => {
                    const checked = value.includes(option.value);

                    return (
                      <li key={option.value}>
                        <label className="hover:bg-gray-50 flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-gray-700">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleValue(option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </Field>
  );
}
