'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Checkbox } from '@ui/components/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ui/components/alert-dialog';

type CustomShareConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
};

export function CustomShareConfirmationDialog({
  open,
  onOpenChange,
  onAccept,
}: CustomShareConfirmationDialogProps) {
  const t = useTranslations('sharing');
  const [checklistState, setChecklistState] = useState<boolean[]>(Array(11).fill(false));

  const checklistItemKeys = useMemo(
    () =>
      [
        'community-confirmation.items.copyright-material-reviewed',
        'community-confirmation.items.copyright-no-protected-upload',
        'community-confirmation.items.copyright-image-reviewed',
        'community-confirmation.items.copyright-sources-provided',
        'community-confirmation.items.personal-no-data',
        'community-confirmation.items.personal-no-invitation',
        'community-confirmation.items.ethics-no-real-person',
        'community-confirmation.items.ethics-no-discrimination',
        'community-confirmation.items.content-no-extremism-violence-sexualized',
        'community-confirmation.items.content-no-false-outdated',
        'community-confirmation.items.terms-accepted',
      ] as const,
    [],
  );

  const allChecklistItemsChecked = checklistState.every(Boolean);

  function resetChecklist() {
    setChecklistState(Array(11).fill(false));
  }

  function updateChecklist(index: number, checked: boolean) {
    setChecklistState((prev) => {
      const next = [...prev];
      next[index] = checked;
      return next;
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !allChecklistItemsChecked) {
          return;
        }

        if (!nextOpen) {
          resetChecklist();
        }

        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent
        className="grid max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden p-4 pt-4 sm:max-h-[calc(100dvh-2rem)] sm:w-full sm:gap-6 sm:p-8 sm:pt-6"
        onEscapeKeyDown={(event) => {
          if (!allChecklistItemsChecked) {
            event.preventDefault();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t('community-confirmation.title')}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="min-h-0 overflow-y-auto pr-1 sm:pr-2">
          <div className="space-y-6">
            <AlertDialogDescription>
              {t('community-confirmation.description')}
            </AlertDialogDescription>
            <section className="space-y-3">
              <h3 className="font-semibold">{t('community-confirmation.sections.copyright')}</h3>
              <div className="space-y-2 sm:space-y-3">
                {checklistItemKeys.slice(0, 4).map((itemKey, index) => (
                  <label
                    key={itemKey}
                    htmlFor={`community-checklist-${index}`}
                    className="flex items-start gap-3"
                  >
                    <Checkbox
                      id={`community-checklist-${index}`}
                      className="mt-1"
                      checked={checklistState[index]}
                      onCheckedChange={(checked) => updateChecklist(index, checked === true)}
                    />
                    <span>{t(itemKey)}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">
                {t('community-confirmation.sections.personal-data')}
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {checklistItemKeys.slice(4, 6).map((itemKey, localIndex) => {
                  const index = localIndex + 4;
                  return (
                    <label
                      key={itemKey}
                      htmlFor={`community-checklist-${index}`}
                      className="flex items-start gap-3"
                    >
                      <Checkbox
                        id={`community-checklist-${index}`}
                        className="mt-1"
                        checked={checklistState[index]}
                        onCheckedChange={(checked) => updateChecklist(index, checked === true)}
                      />
                      <span>{t(itemKey)}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">{t('community-confirmation.sections.ethics')}</h3>
              <div className="space-y-2 sm:space-y-3">
                {checklistItemKeys.slice(6, 8).map((itemKey, localIndex) => {
                  const index = localIndex + 6;
                  return (
                    <label
                      key={itemKey}
                      htmlFor={`community-checklist-${index}`}
                      className="flex items-start gap-3"
                    >
                      <Checkbox
                        id={`community-checklist-${index}`}
                        className="mt-1"
                        checked={checklistState[index]}
                        onCheckedChange={(checked) => updateChecklist(index, checked === true)}
                      />
                      <span>{t(itemKey)}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">{t('community-confirmation.sections.content')}</h3>
              <div className="space-y-2 sm:space-y-3">
                {checklistItemKeys.slice(8, 10).map((itemKey, localIndex) => {
                  const index = localIndex + 8;
                  return (
                    <label
                      key={itemKey}
                      htmlFor={`community-checklist-${index}`}
                      className="flex items-start gap-3"
                    >
                      <Checkbox
                        id={`community-checklist-${index}`}
                        className="mt-1"
                        checked={checklistState[index]}
                        onCheckedChange={(checked) => updateChecklist(index, checked === true)}
                      />
                      <span>{t(itemKey)}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">{t('community-confirmation.sections.terms')}</h3>
              <label htmlFor="community-checklist-10" className="flex items-start gap-3">
                <Checkbox
                  id="community-checklist-10"
                  className="mt-1"
                  checked={checklistState[10]}
                  onCheckedChange={(checked) => updateChecklist(10, checked === true)}
                />
                <span>
                  {t('community-confirmation.terms-prefix')}{' '}
                  <Link
                    href="https://ais-chat.schule/terms-of-use/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {t('community-confirmation.terms-link-label')}
                  </Link>{' '}
                  {t('community-confirmation.terms-suffix')}
                </span>
              </label>
            </section>
          </div>
        </div>

        <AlertDialogFooter className="mt-4 sm:pt-0">
          <AlertDialogCancel
            onClick={() => {
              onOpenChange(false);
              resetChecklist();
            }}
          >
            {t('community-confirmation.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!allChecklistItemsChecked}
            onClick={() => {
              onAccept();
              onOpenChange(false);
              resetChecklist();
            }}
          >
            {t('community-confirmation.accept')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
