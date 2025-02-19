import React from 'react';
import { cn } from '@/utils/tailwind';
import { ParagraphWithConditionalTitleTwoLine } from '../common/paragraph-with-conditional-title-two-line';

type PromptSuggestionsProps = {
  suggestions: string[];
  onSelectSuggestion(suggestion: string): void;
  hidden?: boolean;
};

export default function PromptSuggestions({
  suggestions,
  onSelectSuggestion,
  hidden = false,
}: PromptSuggestionsProps) {
  return (
    <div
      className={cn(
        'absolute bottom-28 sm:bottom-24 grid gap-4 grid-cols-2',
        suggestions.length < 2 && 'grid-cols-1',
      )}
    >
      {suggestions.map((suggestion, index) => (
        <button
          onClick={() => onSelectSuggestion(suggestion)}
          key={index}
          className={cn(
            'border-[1px] rounded-enterprise-md py-2.5 px-4 hover:border-primary',
            hidden && 'invisible',
            index === 0 && suggestions.length % 2 !== 0 ? 'col-span-2' : '',
          )}
        >
          <ParagraphWithConditionalTitleTwoLine content={suggestion} />
        </button>
      ))}
    </div>
  );
}
