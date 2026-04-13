'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ui/components/AlertDialog';
import { useRouter } from 'next/navigation';

const LOGOUT_URL = '/api/auth/logout';

type ProductAccessModalProps = {
  modalTitle: string;
  children: React.ReactNode;
} & React.ComponentProps<'button'>;

export default function ProductAccessModal({ children, modalTitle }: ProductAccessModalProps) {
  const t = useTranslations('common');
  const router = useRouter();
  return (
    <AlertDialog open defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{modalTitle}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>{children}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogAction
            variant="outline"
            onClick={() => {
              router.push(LOGOUT_URL);
            }}
          >
            {t('logout')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
