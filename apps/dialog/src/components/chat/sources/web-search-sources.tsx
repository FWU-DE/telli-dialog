'use client';

import { CaretRightIcon, GlobeSimpleIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/tailwind';
import type { TextSearchResult } from 'linkup-sdk';
import { Button } from '@ui/components/Button';

function getSourceTitle(source: TextSearchResult) {
  return source.name.trim() || getSourceDomain(source);
}

function getSourceDomain(source: TextSearchResult) {
  const url = source.url;

  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url;
  }
}

export function useWebSearchSourcesDisclosure() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const scrollIntoView = useCallback(() => {
    panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollIntoView();
    }
  }, [isOpen, scrollIntoView]);

  const openOrScrollIntoView = useCallback(() => {
    if (isOpen) {
      scrollIntoView();
      return;
    }

    setIsOpen(true);
  }, [isOpen, scrollIntoView]);

  const toggleOpen = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  return {
    isOpen,
    panelRef,
    openOrScrollIntoView,
    toggleOpen,
  };
}

export function WebSearchSourcesPanel({
  sources,
  isOpen,
  onToggle,
  panelId,
  panelRef,
}: {
  sources: TextSearchResult[];
  isOpen: boolean;
  onToggle: () => void;
  panelId: string;
  panelRef: RefObject<HTMLDivElement | null>;
}) {
  const tWebsearch = useTranslations('websearch');

  return (
    <div className="flex w-full max-w-172.75 flex-col items-start gap-3" ref={panelRef}>
      <Button
        variant="ghost"
        className="h-auto gap-1 rounded-full bg-black/10 px-3 py-1 text-sm text-main-900 hover:bg-black/15"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        title={tWebsearch('results.toggle')}
      >
        <span>{tWebsearch('results.title')}</span>
        <CaretRightIcon
          className={cn('size-3 transition-transform', isOpen ? 'rotate-90' : 'rotate-0')}
          weight="bold"
        />
      </Button>

      {isOpen && (
        <div
          id={panelId}
          className="w-full overflow-hidden rounded-lg border border-[#e7e7e7] bg-white"
        >
          <div className="max-h-32 overflow-y-auto py-2">
            {sources.map((source, index) => {
              const title = getSourceTitle(source);
              const domain = getSourceDomain(source);

              return (
                <a
                  key={`${source.url}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-auto w-full items-center gap-4 rounded-none px-4 py-0.5 text-left hover:bg-secondary/20"
                  title={title}
                  aria-label={tWebsearch('results.open-source', { source: title })}
                >
                  <span className="min-w-0 flex-1 truncate text-xs leading-[1.9] text-black">
                    {title}
                  </span>
                  <span className="shrink-0 text-xs text-black/70">{domain}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function WebSearchSourcesButton({
  panelId,
  onClick,
}: {
  panelId: string;
  onClick: () => void;
}) {
  const tWebsearch = useTranslations('websearch');

  return (
    <Button
      title={tWebsearch('results.show')}
      onClick={onClick}
      aria-label={tWebsearch('results.show')}
      aria-controls={panelId}
      variant={'ghost'}
      size={'icon'}
      className="text-primary hover:text-primary hover:bg-secondary/30"
    >
      <GlobeSimpleIcon className="size-4" />
    </Button>
  );
}
