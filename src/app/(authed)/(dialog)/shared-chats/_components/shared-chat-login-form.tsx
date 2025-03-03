'use client';

import { useToast } from '@/components/common/toast';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { inputFieldClassName } from '@/utils/tailwind/input';
import React from 'react';
import { checkSharedChatInviteCodeAction } from './actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';

export default function SharedChatLoginForm() {
  const [inviteCode, setInviteCode] = React.useState('');
  const toast = useToast();
  const router = useRouter();
  const t = useTranslations('shared-chats.shared');

  function handleInviteCodeSubmit() {
    checkSharedChatInviteCodeAction({ inviteCode: inviteCode.replace(/\s+/g, '').toUpperCase() })
      .then((sharedChat) => {
        const searchParams = new URLSearchParams({ inviteCode: sharedChat.inviteCode ?? '' });
        router.push(`/ua/shared-chats/${sharedChat.id}/dialog?${searchParams.toString()}`);
      })
      .catch(() => {
        toast.error(t('invalid-code-toast'));
      });
  }

  return (
    <form className="flex flex-col gap-4 w-full">
      <h2 className="text-3xl mb-2 font-medium text-center w-full">{t('join-code')}</h2>
      <input
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
        className={cn(inputFieldClassName, 'focus:border-primary placeholder:text-gray-300')}
      />
      <button
        type="button"
        onClick={handleInviteCodeSubmit}
        className={cn(buttonPrimaryClassName, 'mt-4')}
      >
        {t('enter-chat')}
      </button>
    </form>
  );
}
