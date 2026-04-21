'use client';

import React from 'react';
import { PlusIcon, TrashSimpleIcon } from '@phosphor-icons/react';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Spinner } from '@ui/components/Spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/Tooltip';
import { WebsearchSource } from '@shared/db/types';
import { parseHyperlinks, getDisplayUrl } from '@/utils/web-search/parsing';
import {
  NUMBER_OF_LINKS_LIMIT_FOR_SHARED_CHAT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { useToast } from '@/components/common/toast';
import { ingestWebContentAction } from '@/components/forms/actions';
import { IconButton } from '@ui/components/IconButton';
import { useTranslations } from 'next-intl';

export type CustomChatLinksProps = {
  initialLinks: WebsearchSource[];
  // If onLinksChange is undefined, the component will be in read-only mode
  onLinksChange?: (links: string[]) => Promise<{ success: boolean }>;
};

export function CustomChatLinks({ initialLinks, onLinksChange }: CustomChatLinksProps) {
  const [links, setLinks] = React.useState<WebsearchSource[]>(initialLinks);
  const [currentLink, setCurrentLink] = React.useState('');
  const [processingLinks, setProcessingLinks] = React.useState<Set<string>>(new Set());
  const toast = useToast();
  const t = useTranslations('custom-chat.links');
  const isReadonly = onLinksChange === undefined;

  async function handleAddLink() {
    if (isReadonly) return;

    const normalizedLink = currentLink.trim();

    if (normalizedLink === '') {
      toast.error(t('empty-error'));
      return;
    }

    const linkExists = links.find((item) => item.link === normalizedLink);
    if (linkExists !== undefined) {
      toast.error(t('duplicate-error'));
      setCurrentLink('');
      return;
    }

    const parsedUrls = parseHyperlinks(normalizedLink);
    if (!parsedUrls || parsedUrls[0] !== normalizedLink) {
      toast.error(t('invalid-error'));
      return;
    }

    const newLink: WebsearchSource = { link: normalizedLink };
    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    setCurrentLink('');

    setProcessingLinks((prev) => new Set(prev).add(normalizedLink));

    const ingestResult = await ingestWebContentAction({ url: normalizedLink });
    if (!ingestResult.success || ingestResult.value.errorUrls.length > 0) {
      setLinks((current) => current.filter((item) => item.link !== normalizedLink));
      toast.error(t('loading-error'));
    } else {
      const saveResult = await onLinksChange(updatedLinks.map((l) => l.link));
      if (!saveResult.success) {
        setLinks((current) => current.filter((item) => item.link !== normalizedLink));
        toast.error(t('saving-error'));
      }
    }

    setProcessingLinks((prev) => {
      const next = new Set(prev);
      next.delete(normalizedLink);
      return next;
    });
  }

  async function handleDeleteLink(index: number) {
    if (isReadonly) return;

    const linkToDelete = links[index];
    if (linkToDelete === undefined) return;

    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);

    const result = await onLinksChange(updatedLinks.map((l) => l.link));
    if (!result.success) {
      setLinks((current) => [...current.slice(0, index), linkToDelete, ...current.slice(index)]);
      toast.error(t('delete-error'));
    }
  }

  const maxLinksReached = links.length >= NUMBER_OF_LINKS_LIMIT_FOR_SHARED_CHAT;

  return (
    <div className="flex flex-col gap-8">
      {!isReadonly && (
        // the breakpoint is lg because the sidebar collapses at sm, we want the input to be big enough also between sm and lg
        <div className="flex w-full flex-col gap-2 lg:flex-row">
          <Input
            wrapperClassName="flex-1"
            type="url"
            placeholder={t('placeholder')}
            maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
            showCharacterCount={false}
            value={currentLink}
            disabled={maxLinksReached}
            aria-label={t('aria-input')}
            onChange={(e) => setCurrentLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLink();
              }
            }}
          />
          <Button
            className="self-center"
            disabled={maxLinksReached}
            onClick={handleAddLink}
            aria-label={t('aria-add-link')}
          >
            <PlusIcon className="size-4" />
            {t('add-link')}
          </Button>
        </div>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => {
            const isProcessing = processingLinks.has(link.link);
            const displayTitle = getDisplayUrl(link.link);
            return (
              <div
                key={link.link}
                className="flex items-center gap-1 h-9 px-3 py-0.5 rounded-md bg-primary/15 text-primary text-sm font-medium"
              >
                {isProcessing && <Spinner className="size-4" />}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-37.5 truncate"
                    >
                      {displayTitle}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>{link.link}</TooltipContent>
                </Tooltip>
                {!isReadonly && (
                  <IconButton
                    variant="primary"
                    size="md"
                    className="hover:bg-primary/15"
                    disabled={isProcessing}
                    aria-label={t('aria-delete', { link: displayTitle })}
                    onClick={() => handleDeleteLink(index)}
                  >
                    <TrashSimpleIcon className="size-4" />
                  </IconButton>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
