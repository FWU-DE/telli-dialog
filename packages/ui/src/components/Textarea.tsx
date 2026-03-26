'use client';

import * as React from 'react';
import { useState } from 'react';

import { cn } from '../lib/utils';
import { TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS } from './constants/constants';

type TextareaProps = React.ComponentProps<'textarea'> & {
  showCharacterCount?: boolean;
  maxLength?: number;
};

function Textarea({
  className,
  showCharacterCount = true,
  maxLength = TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}: TextareaProps) {
  const [internalCharCount, setInternalCharCount] = useState<number>(() => {
    if (typeof value === 'string') return value.length;
    return 0;
  });
  const [isFocused, setIsFocused] = useState(false);

  const charCount = typeof value === 'string' ? value.length : internalCharCount;
  const isMaxLengthReached = charCount >= maxLength;
  const isCounterVisible = showCharacterCount && isFocused;

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.currentTarget.value;
    setInternalCharCount(newValue.length);
    onChange?.(event);
  };

  const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <textarea
          data-slot="textarea"
          className={cn(
            'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 lg:text-sm',
            isCounterVisible && 'pb-8',
            isMaxLengthReached && 'border-destructive',
            className,
          )}
          maxLength={maxLength}
          value={value}
          {...props}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {isCounterVisible && (
          <div
            className={cn(
              'absolute bottom-2 right-3 text-xs pointer-events-none',
              isMaxLengthReached ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {charCount}/{maxLength}
          </div>
        )}
      </div>
      {isMaxLengthReached && (
        <p className="text-destructive text-xs" aria-live="polite">
          Die Beschreibung darf maximal {maxLength} Zeichen lang sein.
        </p>
      )}
    </div>
  );
}

export { Textarea };
