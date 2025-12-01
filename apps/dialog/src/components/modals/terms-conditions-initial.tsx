'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { buttonPrimaryClassName, buttonSecondaryClassName } from '@/utils/tailwind/button';
import { DisclaimerConfig } from './const';
import { useTranslations } from 'next-intl';
import Checkbox from '../common/checkbox';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import MarkdownDisplay from '../chat/markdown-display';
import { useTheme } from '@/hooks/use-theme';
import { constructRootLayoutStyle } from '@/utils/tailwind/layout';
import { useSession } from 'next-auth/react';

type TermsConditionsModalProps = {
  handleAccept(): Promise<boolean>;
  disclaimerConfig: DisclaimerConfig;
} & React.ComponentProps<'button'>;

/** This skips the scroll finishing check, to avoid the user from having to scroll to the bottom of the page to accept the terms and conditions. */
const SCROLL_EXCEESING_TOLERANCE = 0.2;
const STANDARD_REM_SIZE = 16;

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
  const session = useSession();

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

  const checkScrollState = () => {
    const div = scrollRef.current;
    if (div) {
      if (div.scrollHeight <= div.clientHeight) {
        setScrollFinished(true);
      } else {
        const overflow = div.scrollHeight - div.clientHeight;
        const shouldBeFinished = overflow <= div.scrollHeight * SCROLL_EXCEESING_TOLERANCE;
        setScrollFinished(shouldBeFinished);
      }
    }
  };

  const handleScroll = () => {
    const div = scrollRef.current;
    if (!div) {
      return;
    }
    const overflow = div.scrollHeight - div.clientHeight;
    // If the overflow is less than 20% of the total height or the scrollTop is less than one line, set the scrollFinished state to true
    setScrollFinished(
      overflow <= div.scrollHeight * SCROLL_EXCEESING_TOLERANCE ||
        div.scrollHeight - div.scrollTop - div.clientHeight <= STANDARD_REM_SIZE,
    );
  };

  const acceptAndClose = async () => {
    await session.update(await handleAccept());
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
          disabled={!checked && disclaimerConfig.showCheckBox}
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
    checkScrollState();
  }, [pageNumber, contents]);

  return (
    <AlertDialog.Root open defaultOpen>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-[#333333] z-30 opacity-30 shadow-[0px_0px_80px_0px_rgba(0,41,102,0.1)]" />
        <AlertDialog.Content
          className="z-50 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-enterprise-md bg-white p-5 lg:p-10 w-full sm:w-[450px] lg:w-[720px]"
          style={constructRootLayoutStyle({ designConfiguration })}
        >
          <AlertDialog.Title asChild>
            <h1 className="text-3xl font-medium pb-5 mb-auto mt-auto">{currentTitle}</h1>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="sr-only">{'Terms and conditions content'}</div>
          </AlertDialog.Description>
          <div className="flex flex-col gap-5 items-start overflow-y-auto max-h-[60vh] disclaimer-content">
            <div className="" ref={scrollRef} onScroll={handleScroll}>
              {currentContent}
            </div>
            {disclaimerConfig.image && (
              <div className="flex justify-center w-full mt-4">
                <Image
                  src={disclaimerConfig.image}
                  alt="Disclaimer"
                  width={300}
                  height={0}
                  style={{ height: 'auto' }}
                  onLoad={checkScrollState}
                />
              </div>
            )}
            {pageNumber === contents.length - 1 && disclaimerConfig.showCheckBox && (
              <div className="flex items-center gap-3 justify-center">
                <Checkbox onCheckedChange={setChecked} checked={checked} />
                <div className="flex-1 disclaimer">
                  <MarkdownDisplay>{disclaimerConfig.acceptLabel ?? ''}</MarkdownDisplay>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-end items-center gap-6 pt-5 mt-auto self-end">
            <AlertDialog.Action asChild>{navigationBar}</AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
