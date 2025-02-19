'use client';

import { useToast } from '@/components/common/toast';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { inputFieldClassName } from '@/utils/tailwind/input';
import React from 'react';
import { checkSharedChatInviteCodeAction } from './actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/utils/tailwind';

export default function SharedChatLoginForm() {
  const [inviteCode, setInviteCode] = React.useState('');
  const toast = useToast();
  const router = useRouter();

  function handleInviteCodeSubmit() {
    checkSharedChatInviteCodeAction({ inviteCode: inviteCode.replace(/\s+/g, '').toUpperCase() })
      .then((sharedChat) => {
        const searchParams = new URLSearchParams({ inviteCode: sharedChat.inviteCode ?? '' });
        router.push(`/ua/shared-chats/${sharedChat.id}/dialog?${searchParams.toString()}`);
      })
      .catch(() => {
        toast.error('Der Code der eingegeben wurde ist entweder abgelaufen oder ungültig.');
      });
  }

  return (
    <form className="flex flex-col gap-4 w-full">
      <h2 className="text-3xl mb-2 font-medium text-center w-full">Mit Code beitreten</h2>
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
        Zum Dialog
      </button>
    </form>
  );
}
