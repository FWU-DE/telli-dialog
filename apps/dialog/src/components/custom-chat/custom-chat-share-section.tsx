'use client';

import CheckboxWithInfo from '@ui/components/common/checkbox-with-info';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { LinkIcon } from '@phosphor-icons/react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useFederalState } from '../providers/federal-state-provider';
import { CustomChatHeading2 } from './custom-chat-heading2';
import { Card, CardRow } from '@ui/components/Card';
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
        <CardRow>
          {federalState?.featureToggles?.isShareTemplateWithSchoolEnabled && schoolSharingName && (
            <CheckboxWithInfo
              name={schoolSharingName}
              control={control}
              label={t('school')}
              tooltip={t('school-tooltip')}
              onCheckedChange={() => onShareChange?.()}
            />
          )}
          {linkSharingName && (
            <CheckboxWithInfo
              name={linkSharingName}
              control={control}
              label={t('link')}
              tooltip={t('link-tooltip')}
              onCheckedChange={() => onShareChange?.()}
            />
          )}
          {linkSharingName && (
            <Controller
              name={linkSharingName}
              control={control}
              render={({ field }) => (
                <Button
                  className="shrink-0"
                  disabled={!field.value}
                  onClick={handleCopyLink}
                  aria-label={t('copy-link')}
                  type="button"
                >
                  <LinkIcon className="size-4" />
                  {t('copy-link')}
                </Button>
              )}
            />
          )}
        </CardRow>
      </Card>
    </div>
  );
}
