'use client';

import CheckboxWithInfo from '@ui/components/common/checkbox-with-info';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { LinkIcon } from '@phosphor-icons/react';
import { Control, FieldValues, Path, useWatch } from 'react-hook-form';
import { useFederalState } from '../providers/federal-state-provider';
import { CustomChatHeading2 } from './custom-chat-heading2';
import { Card, CardRow } from '@ui/components/card';
import { Button } from '@ui/components/button';

type CustomShareSectionProps<T extends FieldValues> = {
  control: Control<T>;
  schoolSharingName: Path<T>;
  communitySharingName: Path<T>;
  linkSharingName: Path<T>;
  linkToShare: string;
  onShareChange?: (change: { name: Path<T>; checked: boolean }) => void;
  suspended?: boolean;
};

export default function CustomShareSection<T extends FieldValues>({
  control,
  schoolSharingName,
  communitySharingName,
  linkSharingName,
  linkToShare,
  onShareChange,
  suspended,
}: CustomShareSectionProps<T>) {
  const t = useTranslations('sharing');
  const toast = useToast();
  const isLinkSharingEnabled = Boolean(
    useWatch({
      control,
      name: linkSharingName,
    }),
  );
  const isCommunityShared = Boolean(
    useWatch({
      control,
      name: communitySharingName as Path<T>,
    }),
  );

  const federalState = useFederalState();

  async function handleCopyLink() {
    const url = new URL(linkToShare, window.location.origin);
    try {
      await navigator.clipboard.writeText(url.href);
      toast.success(t('link-copied'));
    } catch {
      toast.error(t('link-copied-error'));
    }
  }

  return (
    <div className="flex flex-col gap-3 mt-10" id="share-settings">
      <CustomChatHeading2 text={t('label')} />
      <Card>
        <CardRow className="justify-center sm:justify-start">
          {federalState?.featureToggles?.isShareTemplateWithSchoolEnabled && schoolSharingName && (
            <CheckboxWithInfo
              name={schoolSharingName}
              control={control}
              label={t('school')}
              tooltip={t('school-tooltip')}
              testId="school-sharing-checkbox"
              disabled={suspended || isCommunityShared}
              onCheckedChange={(checked) => {
                onShareChange?.({ name: schoolSharingName, checked });
              }}
            />
          )}
          {communitySharingName && (
            <CheckboxWithInfo
              name={communitySharingName}
              control={control}
              label={t('community')}
              tooltip={t('community-tooltip')}
              testId="community-sharing-checkbox"
              disabled={suspended}
              onCheckedChange={(checked) => {
                onShareChange?.({ name: communitySharingName, checked });
              }}
            />
          )}
          <CheckboxWithInfo
            name={linkSharingName}
            control={control}
            label={t('link')}
            tooltip={t('link-tooltip')}
            disabled={suspended || isCommunityShared}
            onCheckedChange={(checked) => {
              onShareChange?.({ name: linkSharingName, checked });
            }}
          />

          <Button
            className="shrink-0"
            disabled={(!isLinkSharingEnabled && !isCommunityShared) || suspended}
            onClick={handleCopyLink}
            aria-label={t('copy-link')}
            type="button"
          >
            <LinkIcon className="size-4" />
            {t('copy-link')}
          </Button>
        </CardRow>
      </Card>
    </div>
  );
}
