'use client';

import React from 'react';
import CheckboxWithInfo from '@/components/common/checkbox-with-info';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { LinkIcon } from '@phosphor-icons/react';
import { cn } from '@/utils/tailwind';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useFederalState } from '../providers/federal-state-provider';

type SharingSectionProps<T extends FieldValues> = {
  control: Control<T>;
  disabled?: boolean;
  schoolSharingName?: Path<T>;
  linkSharingName?: Path<T>;
  onShareChange?: () => void;
};

export default function SharingSection<T extends FieldValues>({
  control,
  disabled = false,
  schoolSharingName,
  linkSharingName,
  onShareChange,
}: SharingSectionProps<T>) {
  const t = useTranslations('sharing');
  const toast = useToast();

  const federalState = useFederalState();

  async function handleCopyLink() {
    const url = new URL(window.location.href);
    url.search = '';
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success(t('link-copied'));
    } catch {
      toast.error(t('link-copied-error'));
    }
  }

  return (
    <fieldset>
      <legend className="font-medium mb-4">{t('label')}</legend>
      <div className="flex items-center gap-6 p-4 border border-gray-200 rounded">
        {federalState?.featureToggles?.isShareTemplateWithSchoolEnabled && schoolSharingName && (
          <Controller
            name={schoolSharingName}
            control={control}
            render={({ field }) => (
              <CheckboxWithInfo
                label={t('school')}
                tooltip={t('school-tooltip')}
                checked={field.value as boolean}
                onCheckedChange={(value) => {
                  field.onChange(value);
                  onShareChange?.();
                }}
                disabled={disabled}
              />
            )}
          />
        )}
        {linkSharingName && (
          <Controller
            name={linkSharingName}
            control={control}
            render={({ field }) => (
              <>
                <CheckboxWithInfo
                  label={t('link')}
                  tooltip={t('link-tooltip')}
                  checked={field.value as boolean}
                  onCheckedChange={(value) => {
                    field.onChange(value);
                    onShareChange?.();
                  }}
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={disabled || !field.value}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium',
                    field.value && !disabled
                      ? 'bg-primary hover:bg-primary-dark'
                      : 'bg-gray-300 cursor-not-allowed',
                  )}
                >
                  <LinkIcon size={16} weight="bold" />
                  {t('copy-link')}
                </button>
              </>
            )}
          />
        )}
      </div>
    </fieldset>
  );
}
