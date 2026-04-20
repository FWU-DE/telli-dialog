'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { XIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';
import { useTranslations } from 'next-intl';
import type { InfoBanner } from '@shared/info-banners/info-banner';
import { cn } from '@/utils/tailwind';

const DISMISSED_INFO_BANNERS_STORAGE_KEY = 'dismissed-info-banner-ids';
const DISMISSED_INFO_BANNERS_EVENT = 'telli:info-banner-dismissed';
const EMPTY_DISMISSED_INFO_BANNERS_SNAPSHOT = '[]';

function subscribeToDismissedInfoBanners(callback: () => void) {
  window.addEventListener(DISMISSED_INFO_BANNERS_EVENT, callback);

  return () => {
    window.removeEventListener(DISMISSED_INFO_BANNERS_EVENT, callback);
  };
}

function getDismissedInfoBannerIds(snapshot: string): string[] {
  try {
    const parsedValue = JSON.parse(snapshot);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

function getDismissedInfoBannerIdsSnapshot(): string {
  try {
    return (
      window.sessionStorage.getItem(DISMISSED_INFO_BANNERS_STORAGE_KEY) ??
      EMPTY_DISMISSED_INFO_BANNERS_SNAPSHOT
    );
  } catch {
    return EMPTY_DISMISSED_INFO_BANNERS_SNAPSHOT;
  }
}

function persistDismissedInfoBannerId(infoBannerId: string) {
  try {
    const dismissedIds = new Set(getDismissedInfoBannerIds(getDismissedInfoBannerIdsSnapshot()));
    dismissedIds.add(infoBannerId);
    window.sessionStorage.setItem(
      DISMISSED_INFO_BANNERS_STORAGE_KEY,
      JSON.stringify(Array.from(dismissedIds)),
    );
    window.dispatchEvent(new Event(DISMISSED_INFO_BANNERS_EVENT));
  } catch {
    // Ignore storage failures and still dismiss in memory for the current render tree.
  }
}

function useDismissedInfoBannerIds() {
  const dismissedInfoBannerIdsSnapshot = useSyncExternalStore(
    subscribeToDismissedInfoBanners,
    getDismissedInfoBannerIdsSnapshot,
    () => null,
  );

  return dismissedInfoBannerIdsSnapshot === null
    ? null
    : getDismissedInfoBannerIds(dismissedInfoBannerIdsSnapshot);
}

export default function ActiveInfoBanners({ infoBanners }: { infoBanners: InfoBanner[] }) {
  const dismissedInfoBannerIds = useDismissedInfoBannerIds();
  const tInfoBanner = useTranslations('info-banner');

  if (dismissedInfoBannerIds === null) {
    return null;
  }

  const dismissedIds = new Set(dismissedInfoBannerIds);
  const currentInfoBanner = infoBanners.find((infoBanner) => !dismissedIds.has(infoBanner.id));
  if (!currentInfoBanner) {
    return null;
  }

  const currentInfoBannerId = currentInfoBanner.id;

  function handleDismiss() {
    persistDismissedInfoBannerId(currentInfoBannerId);
  }

  return (
    <div
      className={cn(
        'px-2 py-0.5',
        currentInfoBanner.type === 'warning' ? 'bg-warning/35' : 'bg-secondary/35',
      )}
    >
      <div className="relative flex min-h-8 items-center justify-center">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2 pr-10 text-center">
          <p className="text-sm leading-5 xs:text-xs font-medium">{currentInfoBanner.message}</p>
          {currentInfoBanner.ctaLabel && currentInfoBanner.ctaUrl ? (
            <Button asChild size="sm" className="shrink-0">
              <Link href={currentInfoBanner.ctaUrl} target="_blank" rel="noopener noreferrer">
                {currentInfoBanner.ctaLabel}
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-1">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={tInfoBanner('close')}
            className="inline-flex items-center justify-center rounded-full transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
