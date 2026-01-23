'use client';

import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { buttonSecondaryClassName } from '@/utils/tailwind/button';
import { useTheme } from '@/hooks/use-theme';
import { constructRootLayoutStyle } from '@/utils/tailwind/layout';

const LOGOUT_URL = '/api/auth/logout';

type ProductAccessModalProps = {
  modalTitle: string;
  children: React.ReactNode;
} & React.ComponentProps<'button'>;

export default function ProductAccessModal({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClick,
  children,
  modalTitle,
}: ProductAccessModalProps) {
  const { designConfiguration } = useTheme();
  const t = useTranslations('common');
  return (
    <AlertDialog.Root open defaultOpen>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-[#333333] z-30 opacity-30 shadow-[0px_0px_80px_0px_rgba(0,41,102,0.1)]" />
        <AlertDialog.Content
          className="z-50 fixed left-1/2 top-1/2 max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-enterprise-md bg-white p-10 w-[350px] lg:w-[564px] max-w-xl"
          style={constructRootLayoutStyle({ designConfiguration })}
        >
          <AlertDialog.Title asChild>
            <h1 className="text-3xl font-medium mb-6">{modalTitle}</h1>
          </AlertDialog.Title>
          <AlertDialog.Description asChild>{children}</AlertDialog.Description>
          <div className="flex flex-wrap justify-end items-center gap-6 mt-10">
            <AlertDialog.Action asChild>
              <Link href={LOGOUT_URL} prefetch={false} className={buttonSecondaryClassName}>
                {t('logout')}
              </Link>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
