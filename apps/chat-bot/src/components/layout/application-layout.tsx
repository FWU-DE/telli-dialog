'use client';

import type { UserAndContext } from '@/auth/types';
import ActiveInfoBanners from '@/components/info-banners/active-info-banners';
import { HeaderExtensionProvider } from '@/components/hooks/use-header-extension';
import { ApplicationHeader } from '@/components/layout/application-header';
import { useCustomPathname } from '@/hooks/use-custom-pathname';
import type { InfoBanner } from '@shared/info-banners/info-banner';
import { ReactNode, useEffect, useRef } from 'react';

export function ApplicationLayout({
  children,
  userAndContext,
  infoBanners,
}: {
  children: ReactNode;
  userAndContext?: UserAndContext;
  infoBanners?: InfoBanner[];
}) {
  const pathname = useCustomPathname();
  const mainScrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainScrollContainerRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <HeaderExtensionProvider>
      <div className="relative flex flex-col h-dvh w-dvw overflow-hidden bg-background-2">
        {infoBanners !== undefined && <ActiveInfoBanners infoBanners={infoBanners} />}
        <ApplicationHeader userAndContext={userAndContext} />
        <main ref={mainScrollContainerRef} className="min-h-0 w-full mx-auto flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </HeaderExtensionProvider>
  );
}
