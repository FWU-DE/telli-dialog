'use client';

import React from 'react';
import Checkbox from '@/components/common/checkbox';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { InfoIcon, LinkIcon } from '@phosphor-icons/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/tailwind';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

type SharingSectionProps<T extends FieldValues> = {
  control: Control<T>;
  disabled?: boolean;
  schoolSharingName?: Path<T>;
  communitySharingName?: Path<T>;
  linkSharingName?: Path<T>;
  onShareChange?: () => void;
};

function CheckboxWithInfo({
  label,
  tooltip,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  tooltip: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <Checkbox
        label={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <TooltipProvider skipDelayDuration={0} delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              aria-label={tooltip}
            >
              <InfoIcon size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-white">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default function SharingSection<T extends FieldValues>({
  control,
  disabled = false,
  schoolSharingName,
  communitySharingName,
  linkSharingName,
  onShareChange,
}: SharingSectionProps<T>) {
  const t = useTranslations('sharing');
  const toast = useToast();

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success(t('link-copied'));
    });
  }

  return (
    <div className="w-full">
      <legend className="font-medium mb-4">{t('label')}</legend>
      <div className="flex items-center gap-6 p-4 border border-gray-200 rounded-lg">
        {schoolSharingName && (
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
        {communitySharingName && (
          <Controller
            name={communitySharingName}
            control={control}
            render={({ field }) => (
              <CheckboxWithInfo
                label={t('community')}
                tooltip={t('community-tooltip')}
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
                    'flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium ml-auto',
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
    </div>
  );
}
