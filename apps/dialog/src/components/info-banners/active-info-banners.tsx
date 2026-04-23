'use client';

import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { XIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';
import { useTranslations } from 'next-intl';
import type { InfoBanner } from '@shared/info-banners/info-banner';
import { trackInfoBannerViewAction } from '@/app/(authed)/(dialog)/actions';
import { cn } from '@/utils/tailwind';

const DISMISSED_INFO_BANNERS_STORAGE_KEY = 'dismissed-info-banner-ids';
const TRACKED_INFO_BANNERS_STORAGE_KEY = 'tracked-info-banner-ids';
const DISMISSED_INFO_BANNERS_EVENT = 'telli:info-banner-dismissed';
const EMPTY_DISMISSED_INFO_BANNERS_SNAPSHOT = '[]';
const pendingTrackedInfoBannerIds = new Set<string>();

function subscribeToDismissedInfoBanners(callback: () => void) {
  window.addEventListener(DISMISSED_INFO_BANNERS_EVENT, callback);

  return () => {
    window.removeEventListener(DISMISSED_INFO_BANNERS_EVENT, callback);
  };
}

function parseInfoBannerIds(snapshot: string): string[] {
  try {
    const parsedValue = JSON.parse(snapshot);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

function getStoredInfoBannerIdsSnapshot(storageKey: string): string {
  try {
    return window.sessionStorage.getItem(storageKey) ?? EMPTY_DISMISSED_INFO_BANNERS_SNAPSHOT;
  } catch {
    return EMPTY_DISMISSED_INFO_BANNERS_SNAPSHOT;
  }
}

function getStoredInfoBannerIds(storageKey: string): string[] {
  return parseInfoBannerIds(getStoredInfoBannerIdsSnapshot(storageKey));
}

function persistStoredInfoBannerId(storageKey: string, infoBannerId: string) {
  try {
    const storedIds = new Set(getStoredInfoBannerIds(storageKey));
    storedIds.add(infoBannerId);
    window.sessionStorage.setItem(storageKey, JSON.stringify(Array.from(storedIds)));
  } catch {
    // Ignore storage failures and still dismiss in memory for the current render tree.
  }
}

function persistDismissedInfoBannerId(infoBannerId: string) {
  persistStoredInfoBannerId(DISMISSED_INFO_BANNERS_STORAGE_KEY, infoBannerId);
  window.dispatchEvent(new Event(DISMISSED_INFO_BANNERS_EVENT));
}

function useDismissedInfoBannerIds() {
  const dismissedInfoBannerIdsSnapshot = useSyncExternalStore(
    subscribeToDismissedInfoBanners,
    () => getStoredInfoBannerIdsSnapshot(DISMISSED_INFO_BANNERS_STORAGE_KEY),
    () => EMPTY_DISMISSED_INFO_BANNERS_SNAPSHOT,
  );

  return parseInfoBannerIds(dismissedInfoBannerIdsSnapshot);
}

export default function ActiveInfoBanners({ infoBanners }: { infoBanners: InfoBanner[] }) {
  const dismissedInfoBannerIds = useDismissedInfoBannerIds();
  const tInfoBanner = useTranslations('info-banner');

  const dismissedIds = new Set(dismissedInfoBannerIds);
  const currentInfoBanner = infoBanners.find((infoBanner) => !dismissedIds.has(infoBanner.id));
  const currentInfoBannerId = currentInfoBanner?.id ?? null;

  useEffect(() => {
    if (!currentInfoBannerId) {
      return;
    }

    if (
      pendingTrackedInfoBannerIds.has(currentInfoBannerId) ||
      getStoredInfoBannerIds(TRACKED_INFO_BANNERS_STORAGE_KEY).includes(currentInfoBannerId)
    ) {
      return;
    }

    pendingTrackedInfoBannerIds.add(currentInfoBannerId);

    void trackInfoBannerViewAction(currentInfoBannerId)
      .then(() => {
        persistStoredInfoBannerId(TRACKED_INFO_BANNERS_STORAGE_KEY, currentInfoBannerId);
      })
      .finally(() => {
        pendingTrackedInfoBannerIds.delete(currentInfoBannerId);
      });
  }, [currentInfoBannerId]);

  if (!currentInfoBanner) {
    return null;
  }

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
          {currentInfoBanner.buttonLabel && currentInfoBanner.buttonUrl ? (
            <Button asChild size="sm" className="shrink-0">
              <Link href={currentInfoBanner.buttonUrl} target="_blank" rel="noopener noreferrer">
                {currentInfoBanner.buttonLabel}
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleDismiss}
            aria-label={tInfoBanner('close')}
            className="rounded-full"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
