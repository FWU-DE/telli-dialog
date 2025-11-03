import React from 'react';
import { FieldArrayWithId } from 'react-hook-form';
import { cn } from '@/utils/tailwind';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import Citation from '@/components/chat/sources/citation';
import PlusIcon from '@/components/icons/plus';
import { parseHyperlinks } from '@/utils/web-search/parsing';
import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { useToast } from '../common/toast';
import { useTranslations } from 'next-intl';

const MAX_LINKS = 5;

type AttachedLinksProps = {
  fields: FieldArrayWithId<WebsearchSource, never, 'id'>[];
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
  const toast = useToast();
  function appendLink(content: string) {
    const currentValues = getValues() || [];

    if (currentValues.length >= MAX_LINKS) {
      toast.error(tToast('max-links-reached', { max_links: MAX_LINKS }));
      return;
    }
    if (content === '') {
      toast.error(tToast('empty-url'));
      return;
    }

    const linkExists = currentValues.find((item: WebsearchSource) => item.link === content);
    if (linkExists !== undefined) {
      toast.error(tToast('duplicate-url'));
      setCurrentAttachedLink('');
      return;
    }

    const isValidUrl = parseHyperlinks(content);
    if (!isValidUrl) {
      toast.error(tToast('invalid-url'));
      return;
    }
    setValue([
      ...currentValues,
      { link: content, name: '', type: 'websearch', content: '', error: false },
    ]);
    setCurrentAttachedLink('');
  }

  function handleDeleteLink(index: number) {
    const currentValues = getValues();
    const newValues = currentValues.filter((_: WebsearchSource, i: number) => i !== index);
    setValue(newValues);
    handleAutosave();
  }
  const maxLinksReached = (getValues() || []).length >= MAX_LINKS;
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
            disabled={readOnly || maxLinksReached}
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
          {fields.map((field, index) => (
            <div className="flex flex-row gap-2" key={`${field.id}-${index}`}>
              <Citation
                source={field as unknown as WebsearchSource}
                className="bg-secondary-dark rounded-enterprise-sm h-10"
                handleDelete={() => handleDeleteLink(index)}
                index={index}
                sourceIndex={0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
