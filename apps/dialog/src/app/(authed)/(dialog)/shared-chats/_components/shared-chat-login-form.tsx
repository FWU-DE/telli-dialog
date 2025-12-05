'use client';

import { useToast } from '@/components/common/toast';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { inputFieldClassName } from '@/utils/tailwind/input';
import React from 'react';
import { getChatIdByInviteCodeAction } from './actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';

export default function SharedChatLoginForm() {
  const [inviteCode, setInviteCode] = React.useState('');
  const toast = useToast();
  const router = useRouter();
  const t = useTranslations('shared-chats.shared');

  async function getChatByInviteCode(formattedInviteCode: string) {
    const result = await getChatIdByInviteCodeAction(formattedInviteCode);
    if (result.success) return result.value;
    return undefined;
  }

  async function handleInviteCodeSubmit() {
    const formattedInviteCode = inviteCode.replace(/\s+/g, '').toUpperCase();
    const result = await getChatByInviteCode(formattedInviteCode);
    if (result !== undefined) {
      const { type, id, inviteCode } = result;
      const searchParams = new URLSearchParams({ inviteCode });
      const pathSegment = type === 'character' ? 'characters' : 'shared-chats'; // learning-scenarios are still mapped under shared-chats
      const route = `/ua/${pathSegment}/${id}/dialog?${searchParams.toString()}`;
      router.push(route);
      return;
    }

    toast.error(t('invalid-code-toast'));
  }

  return (
    <form className="flex flex-col gap-4 w-full">
      <h2 className="text-3xl mb-2 font-medium text-center w-full">{t('join-code')}</h2>
      <input
        id="login-invite-code"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleInviteCodeSubmit();
          }
        }}
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
