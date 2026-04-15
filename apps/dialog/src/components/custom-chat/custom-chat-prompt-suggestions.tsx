'use client';

import {
  EXAMPLE_PROMPT_LENGTH_LIMIT,
  NUMBER_OF_EXAMPLE_PROMPTS_LIMIT,
} from '@/configuration-text-inputs/const';
import { useEffect, useRef } from 'react';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/Tooltip';
import { PlusIcon, TrashSimpleIcon } from '@phosphor-icons/react';
import { AssistantFormValues } from '@/app/(authed)/(dialog)/assistants/editor/[assistantId]/assistant-edit';
import { IconButton } from '@ui/components/IconButton';
import { FormField } from '@ui/components/form/FormField';

type WithPromptSuggestions = {
  promptSuggestions: { value: string }[];
};

type CustomChatPromptSuggestionsProps = {
  control: Control<AssistantFormValues>;
  onBlur: () => void;
};

export function CustomChatPromptSuggestions(props: CustomChatPromptSuggestionsProps) {
  const { control, onBlur } = props;
  const t = useTranslations('assistants');
  const promptSuggestions = useWatch({
    control,
    name: 'promptSuggestions',
  });
  const promptSuggestionsCount = promptSuggestions.length;
  const previousPromptSuggestionsCountRef = useRef(promptSuggestionsCount);

  useEffect(() => {
    if (promptSuggestionsCount < previousPromptSuggestionsCountRef.current) {
      onBlur();
    }

    previousPromptSuggestionsCountRef.current = promptSuggestionsCount;
  }, [onBlur, promptSuggestionsCount]);

  const lastPromptSuggestionValue = promptSuggestions[promptSuggestions.length - 1]?.value ?? '';

  const {
    fields: promptSuggestionFields,
    append,
    remove: removePromptSuggestion,
  } = useFieldArray({
    control: control,
    name: 'promptSuggestions',
  });
  const appendPromptSuggestion = append as (
    value: WithPromptSuggestions['promptSuggestions'][number],
  ) => void;

  return promptSuggestionFields.map((fieldItem, index) => {
    const isLastItem = index === promptSuggestionFields.length - 1;
    const hasReachedPromptSuggestionsLimit =
      promptSuggestionFields.length >= NUMBER_OF_EXAMPLE_PROMPTS_LIMIT;
    const isAddPromptSuggestionDisabled =
      hasReachedPromptSuggestionsLimit || lastPromptSuggestionValue.trim() === '';

    const addIconButton = (
      <IconButton
        type="button"
        aria-label={t('prompt-suggestions-add-button')}
        data-testid={`add-prompt-suggestion-${index + 1}-button`}
        aria-disabled={isAddPromptSuggestionDisabled}
        onClick={
          isAddPromptSuggestionDisabled ? undefined : () => appendPromptSuggestion({ value: '' })
        }
      >
        <PlusIcon className="size-5" />
      </IconButton>
    );

    return (
      <FormField
        key={index}
        name={`promptSuggestions.${index}.value`}
        control={control}
        label={`${t('prompt-suggestion')} ${index + 1}`}
        testId={`prompt-suggestion-${index + 1}-input`}
        onBlur={onBlur}
        type="text"
        wrapperClassName="w-full"
        maxLength={EXAMPLE_PROMPT_LENGTH_LIMIT}
        maxLengthErrorMessage={t('prompt-suggestions-max-length', {
          maxLength: EXAMPLE_PROMPT_LENGTH_LIMIT,
        })}
        placeholder={t('prompt-suggestion-placeholder')}
      >
        {(input) => (
          <div className="flex items-start gap-3">
            {input}
            <div className="mt-1.5">
              {isLastItem ? (
                isAddPromptSuggestionDisabled ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{addIconButton}</TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {hasReachedPromptSuggestionsLimit
                          ? t('prompt-suggestions-max-count', {
                              maxCount: NUMBER_OF_EXAMPLE_PROMPTS_LIMIT,
                            })
                          : t('prompt-suggestions-empty-tooltip')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  addIconButton
                )
              ) : (
                <IconButton
                  type="button"
                  aria-label={t('prompt-suggestions-delete-button', { index: index + 1 })}
                  data-testid={`delete-prompt-suggestion-${index + 1}-button`}
                  onClick={() => removePromptSuggestion(index)}
                >
                  <TrashSimpleIcon className="size-5 " />
                </IconButton>
              )}
            </div>
          </div>
        )}
      </FormField>
    );
  });
}
