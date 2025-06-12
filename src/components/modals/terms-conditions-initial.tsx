'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { buttonPrimaryClassName, buttonSecondaryClassName } from '@/utils/tailwind/button';
import { DisclaimerConfig } from './const';
import { useTranslations } from 'next-intl';
import Checkbox from '../common/checkbox';
import { useRouter } from 'next/navigation';

import MarkdownDisplay from '../chat/markdown-display';
import { useTheme } from '@/hooks/use-theme';
import { constructRootLayoutStyle } from '@/utils/tailwind/layout';

type TermsConditionsModalProps = {
  handleAccept(): void;
  disclaimerConfig: DisclaimerConfig;
} & React.ComponentProps<'button'>;

/** This skips the scroll finishing check, to avoid the user from having to scroll to the bottom of the page to accept the terms and conditions. */
const SCROLL_EXCEESING_TOLERANCE = 0.2;

export default function TermsConditionsModal({
  disclaimerConfig,
  handleAccept,
}: TermsConditionsModalProps) {
  const [pageNumber, setPageNumber] = useState(0);
  const [scrollFinished, setScrollFinished] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const tUsage = useTranslations('usage-disclaimer');
  const tCommon = useTranslations('common');
  const { designConfiguration } = useTheme();

  const nextPage = () => {
    setPageNumber(pageNumber + 1);
  };
  const prevPage = () => {
    setPageNumber(pageNumber - 1);
    setScrollFinished(false);
    setChecked(false);
  };

  const contents: Array<string> = disclaimerConfig.pageContents;

  const scrollRef = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    const div = scrollRef.current;
    if (div) {
      const remainingScroll = div.scrollHeight - div.scrollTop - div.clientHeight;
      setScrollFinished(remainingScroll <= div.scrollHeight * SCROLL_EXCEESING_TOLERANCE);
    }
  };

  const acceptAndClose = () => {
    handleAccept();
    router.refresh();
  };

  const navigationBar = (
    <div className="gap-6 flex flex-row">
      {pageNumber >= 1 ? (
        <button onClick={prevPage} className={buttonSecondaryClassName}>
          {tCommon('back')}
        </button>
      ) : null}
      {pageNumber === disclaimerConfig.pageContents.length - 1 ? (
        <button
          onClick={acceptAndClose}
          className={buttonPrimaryClassName}
          disabled={!(checked && scrollFinished) && disclaimerConfig.showCheckBox}
        >
          {tCommon('accept')}
        </button>
      ) : (
        <button
          onClick={nextPage}
          className={buttonPrimaryClassName}
          disabled={pageNumber > 0 && !scrollFinished}
        >
          {tCommon('continue')}
        </button>
      )}
    </div>
  );

  const currentTitle =
    pageNumber >= 1 ? tUsage('terms-and-conditions-title') : tUsage('initial-title');
  const currentContent = <MarkdownDisplay>{contents[pageNumber] ?? ''}</MarkdownDisplay>;

  useEffect(() => {
    const div = scrollRef.current;
    if (div) {
      if (div.scrollHeight <= div.clientHeight) {
        setScrollFinished(true);
      } else {
        const overflow = div.scrollHeight - div.clientHeight;
        setScrollFinished(overflow <= div.scrollHeight * SCROLL_EXCEESING_TOLERANCE);
      }
    }
  }, [pageNumber, contents]);

  return (
    <AlertDialog.Root open defaultOpen>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-[#333333] z-30 opacity-30 shadow-[0px_0px_80px_0px_rgba(0,41,102,0.1)]" />
        <AlertDialog.Content
          className="z-50 fixed left-1/2 top-1/2 max-h-[100vh] -translate-x-1/2 -translate-y-1/2 rounded-enterprise-md bg-white p-10 w-[450px] lg:w-[720px]"
          style={constructRootLayoutStyle({ designConfiguration })}
        >
          <AlertDialog.Title asChild>
            <h1 className="text-3xl font-medium p-1 mb-auto mt-auto">{currentTitle}</h1>
          </AlertDialog.Title>
          <div className="flex flex-col gap-5 items-start p-2">
            <div
              className="overflow-y-auto max-h-[60vh] mt-4"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              {currentContent}
            </div>
            {pageNumber === contents.length - 1 && disclaimerConfig.showCheckBox && (
              <Checkbox
                onCheckedChange={setChecked}
                label={disclaimerConfig.acceptLabel}
              ></Checkbox>
            )}
            <div className="flex flex-wrap justify-end items-center gap-6 mt-auto self-end">
              <AlertDialog.Action asChild>{navigationBar}</AlertDialog.Action>
            </div>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
