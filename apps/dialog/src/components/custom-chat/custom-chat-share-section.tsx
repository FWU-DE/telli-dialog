'use client';

import React from 'react';
import CheckboxWithInfo from '@/components/common/checkbox-with-info';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { LinkIcon } from '@phosphor-icons/react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useFederalState } from '../providers/federal-state-provider';
import { CustomChatHeading2 } from './custom-chat-heading2';
import { Card, CardContent } from '@ui/components/Card';
import { Button } from '@ui/components/Button';

type CustomShareSectionProps<T extends FieldValues> = {
  control: Control<T>;
  schoolSharingName?: Path<T>;
  linkSharingName?: Path<T>;
  onShareChange?: () => void;
};

export default function CustomShareSection<T extends FieldValues>({
  control,
  schoolSharingName,
  linkSharingName,
  onShareChange,
}: CustomShareSectionProps<T>) {
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
    <div className="flex flex-col gap-3 mt-10">
      <CustomChatHeading2 text={t('label')} />
      <Card>
        <CardContent className="flex flex-row items-center gap-6">
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
                  />
                  <Button
                    disabled={!field.value}
                    onClick={handleCopyLink}
                    aria-label="Link kopieren"
                  >
                    <LinkIcon className="size-4" />
                    Link kopieren
                  </Button>
                </>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
