'use client';

import SharedChatLoginForm from '../../(authed)/(dialog)/shared-chats/_components/shared-chat-login-form';
import { buttonSecondaryClassName } from '@/utils/tailwind/button';
import { signIn } from 'next-auth/react';
import React, { useEffect } from 'react';
import TelliLogo from '@/components/icons/logo';
import { cn } from '@/utils/tailwind';
import { useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const vidis_idp_hint = searchParams.get('vidis_idp_hint');

  useEffect(() => {
    // automatic sign-in if vidis_idp_hint is present
    if (!!vidis_idp_hint) {
      signIn('vidis', undefined, { vidis_idp_hint: vidis_idp_hint });
    }
  }, [vidis_idp_hint]);

  return (
    <main className="w-full flex flex-col justify-center items-center max-w-72 mx-auto py-4 h-full">
      <div className="my-auto flex flex-col items-center w-full">
        <TelliLogo className="text-primary my-8 sm:my-16 w-40" />
        <SharedChatLoginForm />
        <div className="flex gap-2 items-center w-full justify-center py-8">
          <hr className="flex-grow border-t border-gray-200" />
          <span className="text-sm text-gray-200">oder</span>
          <hr className="flex-grow border-t border-gray-200" />
        </div>
        <button
          className={cn(buttonSecondaryClassName, 'w-full')}
          onClick={() => signIn('vidis')}
          aria-label="Mit VIDIS einloggen"
        >
          Mit VIDIS einloggen
        </button>
      </div>
    </main>
  );
}
