'use client';

import React, { useRef, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { buttonPrimaryClassName, buttonSecondaryClassName } from '@/utils/tailwind/button';
import { TERM_AND_CONDITIONS } from './static_content';
import { useTranslations } from 'next-intl';
import Checkbox from '../common/checkbox';
import { useRouter } from 'next/navigation';

type TermsConditionsModalProps = {
  handleAccept(): void;
} & React.ComponentProps<'button'>;

export default function TermsConditionsModal({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleAccept,
}: TermsConditionsModalProps) {
  const [showMainContent, setShowMainContent] = useState(false);
  const [scrollFinished, setScrollFinished] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const tUsage = useTranslations('usage-disclaimer');
  const tCommon = useTranslations('common');
  const initialContent = tUsage('initial-content');
  const mainContent = TERM_AND_CONDITIONS.map((paragraph, index) => {
    return (
      <div key={index}>
        <p className="text-normal w-full text-left">{paragraph}</p>
        <br />
      </div>
    );
  });
  const nextPage = () => {
    setShowMainContent(true);
  };
  const prevPage = () => {
    setShowMainContent(false);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    const div = scrollRef.current;
    if (div) {
      setScrollFinished(div.scrollHeight - div.scrollTop <= div.clientHeight);
    }
  };

  const acceptAndClose = () => {
    handleAccept();
    router.refresh();
  };

  const navigationBar = (
    <div className="gap-6 flex flex-row">
      {showMainContent ? (
        <button onClick={prevPage} className={buttonSecondaryClassName}>
          {tCommon('back')}
        </button>
      ) : null}
      {showMainContent ? (
        <button
          onClick={acceptAndClose}
          className={buttonPrimaryClassName}
          disabled={!(checked && scrollFinished)}
        >
          {tCommon('accept')}
        </button>
      ) : (
        <button onClick={nextPage} className={buttonPrimaryClassName}>
          {tCommon('continue')}
        </button>
      )}
    </div>
  );

  const currentTitle = showMainContent
    ? tUsage('terms-and-conditions-title')
    : tUsage('initial-title');
  const currentContent = showMainContent ? mainContent : initialContent;

  return (
    <AlertDialog.Root open defaultOpen>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-[#333333] z-30 opacity-30 shadow-[0px_0px_80px_0px_rgba(0,41,102,0.1)]" />
        <AlertDialog.Content className="z-50 fixed left-1/2 top-1/2 max-h-[100vh] -translate-x-1/2 -translate-y-1/2 rounded-enterprise-md bg-white p-10 w-[450px] lg:w-[720px]">
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
            {showMainContent ? (
              <Checkbox onCheckedChange={setChecked} label={tUsage('accept')}></Checkbox>
            ) : null}
            <div className="flex flex-wrap justify-end items-center gap-6 mt-auto self-end">
              <AlertDialog.Action asChild>{navigationBar}</AlertDialog.Action>
            </div>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
