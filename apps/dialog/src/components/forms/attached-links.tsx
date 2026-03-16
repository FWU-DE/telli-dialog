import React from 'react';
import { cn } from '@/utils/tailwind';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import Citation from '@/components/chat/sources/citation';
import PlusIcon from '@/components/icons/plus';
import { parseHyperlinks } from '@/utils/web-search/parsing';
import {
  NUMBER_OF_LINKS_LIMIT_FOR_SHARED_CHAT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { useToast } from '../common/toast';
import { useTranslations } from 'next-intl';
import { WebsearchSource } from '@shared/db/types';
import { ingestWebContentAction } from './actions';

type AttachedLinksProps = {
  fields: WebsearchSource[];
  getValues: () => WebsearchSource[];
  setValue: (value: WebsearchSource[]) => void;
  t: ReturnType<typeof useTranslations>;
  tToast: ReturnType<typeof useTranslations>;
  readOnly?: boolean;
  handleAutosave: () => void;
};

export function AttachedLinks({
  fields,
  getValues,
  setValue,
  handleAutosave,
  t,
  tToast,
  readOnly = false,
}: AttachedLinksProps) {
  const [currentAttachedLink, setCurrentAttachedLink] = React.useState('');
  const [processingLinks, setProcessingLinks] = React.useState<Set<string>>(new Set());
  const toast = useToast();

  async function appendLink(content: string) {
    const normalizedContent = content.trim();
    const currentValues = getValues() || [];

    if (normalizedContent === '') {
      toast.error(tToast('empty-url'));
      return;
    }

    const linkExists = currentValues.find(
      (item: WebsearchSource) => item.link === normalizedContent,
    );
    if (linkExists !== undefined) {
      toast.error(tToast('duplicate-url'));
      setCurrentAttachedLink('');
      return;
    }

    const parsedUrls = parseHyperlinks(normalizedContent);
    if (!parsedUrls || parsedUrls[0] !== normalizedContent) {
      toast.error(tToast('invalid-url'));
      return;
    }

    // Add the link optimistically to the form
    setValue([...currentValues, { link: normalizedContent, name: '', content: '', error: false }]);
    setCurrentAttachedLink('');

    // Start ingestion in background
    setProcessingLinks((prev) => new Set(prev).add(normalizedContent));
    const result = await ingestWebContentAction({ url: normalizedContent });
    if (!result.success || result.value.errorUrls.length > 0) {
      // Remove the link from the form if ingestion fails
      const latestValues = getValues();
      setValue(latestValues.filter((item: WebsearchSource) => item.link !== normalizedContent));
      toast.error(tToast('scrape-error'));
    }
    setProcessingLinks((prev) => {
      const next = new Set(prev);
      next.delete(normalizedContent);
      return next;
    });
    handleAutosave();
  }

  function handleDeleteLink(index: number) {
    const currentValues = getValues();
    const newValues = currentValues.filter((_: WebsearchSource, i: number) => i !== index);
    setValue(newValues);
    handleAutosave();
  }

  const maxLinksReached = getValues().length >= NUMBER_OF_LINKS_LIMIT_FOR_SHARED_CHAT;

  return (
    <div className="flex flex-col gap-4">
      <label className={cn(labelClassName, 'text-sm')}>{t('attached-links-label')}</label>
      <div className="flex flex-row gap-2">
        <input
          type="url"
          className={cn(
            inputFieldClassName,
            'focus:border-primary placeholder:text-gray-300 flex-1',
          )}
          placeholder={t('attached-links-placeholder')}
          onBlur={(e) => {
            e.stopPropagation();
          }}
          maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
          onChange={(e) => {
            setCurrentAttachedLink(e.target.value);
          }}
          value={currentAttachedLink}
          disabled={readOnly}
        />
        {!readOnly && (
          <button
            type="button"
            className={cn(buttonPrimaryClassName, 'flex items-center gap-2 py-1 my-0')}
            disabled={maxLinksReached}
            onClick={(e) => {
              e.stopPropagation();
              appendLink(currentAttachedLink);
            }}
          >
            <PlusIcon className="fill-primary-text w-8 h-8" />
            {t('add-link')}
          </button>
        )}
      </div>
      <div>
        <div className="flex flex-wrap gap-2">
          {fields.map((field, index) => {
            const isLinkProcessing = processingLinks.has(field.link);
            return (
              <div className="flex flex-row gap-2" key={field.link}>
                <Citation
                  source={field}
                  className="h-10"
                  handleDelete={!readOnly ? () => handleDeleteLink(index) : undefined}
                  isLoading={isLinkProcessing}
                  index={index}
                  sourceIndex={0}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
