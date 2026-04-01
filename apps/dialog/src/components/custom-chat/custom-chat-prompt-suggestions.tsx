'use client';

import {
  EXAMPLE_PROMPT_LENGTH_LIMIT,
  NUMBER_OF_EXAMPLE_PROMPTS_LIMIT,
} from '@/configuration-text-inputs/const';
import { useEffect, useRef } from 'react';
import { Control, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { Field, FieldLabel, FieldError } from '@ui/components/Field';
import { Input } from '@ui/components/Input';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/Tooltip';
import { cn } from '@/utils/tailwind';
import { iconClassName } from '@/utils/tailwind/icon';
import { PlusIcon, TrashSimpleIcon } from '@phosphor-icons/react';
import { AssistantFormValues } from '@/app/(authed)/(dialog)/assistants/editor/[assistantId]/assistant-edit';
import { Button } from '@ui/components/Button';

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

    return (
      <Field key={fieldItem.id}>
        <FieldLabel htmlFor={`promptSuggestions.${index}.value`}>
          {`${t('prompt-suggestion')} ${index + 1}`}
        </FieldLabel>
        <div className="flex items-center gap-3">
          <Controller
            name={`promptSuggestions.${index}.value`}
            control={control}
            render={({ field, fieldState }) => (
              <div className="w-full">
                <Input
                  {...field}
                  id={`promptSuggestions.${index}.value`}
                  aria-invalid={fieldState.invalid}
                  maxLength={EXAMPLE_PROMPT_LENGTH_LIMIT}
                  maxLengthErrorMessage={t('prompt-suggestions-max-length', {
                    maxLength: EXAMPLE_PROMPT_LENGTH_LIMIT,
                  })}
                  placeholder={t('prompt-suggestion')}
                  autoComplete="off"
                  onBlur={() => {
                    field.onBlur();
                    onBlur();
                  }}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </div>
            )}
          />

          {isLastItem ? (
            <Tooltip>
              <TooltipTrigger asChild aria-label={t('prompt-suggestions-add-button-tooltip')}>
                <span tabIndex={0} className="inline-flex">
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(iconClassName)}
                    aria-label={t('prompt-suggestions-add-button')}
                    disabled={isAddPromptSuggestionDisabled}
                    style={isAddPromptSuggestionDisabled ? { pointerEvents: 'none' } : undefined}
                    onClick={() => {
                      appendPromptSuggestion({ value: '' });
                    }}
                  >
                    <PlusIcon className="size-5" />
                  </Button>
                </span>
              </TooltipTrigger>
              {hasReachedPromptSuggestionsLimit && (
                <TooltipContent>
                  <p>
                    {t('prompt-suggestions-max-count', {
                      maxCount: NUMBER_OF_EXAMPLE_PROMPTS_LIMIT,
                    })}
                  </p>
                </TooltipContent>
              )}
              {!hasReachedPromptSuggestionsLimit && lastPromptSuggestionValue.trim() === '' && (
                <TooltipContent>
                  <p>{t('prompt-suggestions-empty-tooltip')}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className={cn(iconClassName)}
              aria-label={t('prompt-suggestions-delete-button', { index: index + 1 })}
              onClick={() => {
                removePromptSuggestion(index);
              }}
            >
              <TrashSimpleIcon className="size-5 " />
            </Button>
          )}
        </div>
      </Field>
    );
  });
}
