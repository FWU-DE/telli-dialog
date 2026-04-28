import { FileModel } from '@shared/db/schema';
import DisplayUploadedFile from './display-uploaded-file';
import DisplayUploadedImage, { type PendingFileModel } from './display-uploaded-image';
import TelliClipboardButton from '../common/clipboard-button';
import ReloadIcon from '../icons/reload';
import MarkdownDisplay from './markdown-display';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';
import Citation from './sources/citation';
import { parseHyperlinks } from '@/utils/web-search/parsing';
import { iconClassName } from '@/utils/tailwind/icon';
import useBreakpoints from '../hooks/use-breakpoints';
import { isImageFile } from '@/utils/files/generic';
import { type UIMessage, type ChatStatus } from '@/types/chat';
import { ReactNode } from 'react';
import { WebsearchSource } from '@shared/db/types';
import {
  WebSearchSourcesButton,
  WebSearchSourcesPanel,
  useWebSearchSourcesDisclosure,
} from './sources/web-search-sources';

// Re-export for consumers
export type { PendingFileModel };

export function ChatBox({
  assistantIcon,
  children,
  fileMapping,
  pendingFileMapping,
  index,
  websources,
  isLastNonUser,
  isLoading,
  regenerateMessage,
  status,
}: {
  assistantIcon?: ReactNode;
  children: UIMessage;
  fileMapping?: Map<string, FileModel[]>;
  pendingFileMapping?: Map<string, PendingFileModel[]>;
  index: number;
  websources?: WebsearchSource[];
  isLastNonUser: boolean;
  isLoading: boolean;
  regenerateMessage: () => void;
  status: ChatStatus;
}) {
  const tCommon = useTranslations('common');
  const { isAtLeast } = useBreakpoints();
  const {
    isOpen: isAssistantSourcesOpen,
    panelRef,
    openOrScrollIntoView,
    toggleOpen,
  } = useWebSearchSourcesDisclosure();

  const userClassName =
    children.role === 'user'
      ? 'w-fit p-4 rounded-2xl rounded-br-none self-end bg-secondary/30 max-w-[70%] wrap-break-word'
      : 'w-fit';

  // Check both DB file mapping and pending files for this message
  const dbFiles = fileMapping?.get(children.id);
  const pendingFiles = pendingFileMapping?.get(children.id);
  // Prefer DB files if available (they're persisted), otherwise use pending files
  const allFiles = dbFiles ?? pendingFiles;
  const hasFiles = allFiles !== undefined && allFiles.length > 0;

  const parsedUrls = children.role === 'user' ? (parseHyperlinks(children.content) ?? []) : [];
  const userWebsearchSources = children.role === 'user' ? [...(websources ?? [])] : [];
  const assistantWebsearchSources =
    children.role === 'assistant' ? (children.textSearchResults ?? []) : [];

  for (const url of parsedUrls) {
    if (userWebsearchSources.find((source) => source.link === url) === undefined) {
      userWebsearchSources.push({ link: url });
    }
  }

  // Separate image files from non-image files
  const imageFiles = allFiles?.filter((file) => isImageFile(file.name)) ?? [];
  const nonImageFiles = allFiles?.filter((file) => !isImageFile(file.name)) ?? [];

  const maybeFileAttachment =
    hasFiles && children.role === 'user' ? (
      <div className="flex flex-col gap-4 pb-0 pt-0 self-end mb-4">
        {/* Display images */}
        {imageFiles.length > 0 && (
          <div className="flex flex-row gap-2 overflow-auto">
            {imageFiles.map((file) => (
              <DisplayUploadedImage
                file={file}
                status="processed"
                key={file.id}
                showBanner={false}
              />
            ))}
          </div>
        )}
        {/* Display non-image files */}
        {nonImageFiles.length > 0 && (
          <div className="flex flex-row gap-2 overflow-auto">
            {nonImageFiles.map((file) => (
              <DisplayUploadedFile fileName={file.name} status="processed" key={file.id} />
            ))}
          </div>
        )}
      </div>
    ) : null;

  const maybeUserWebpageCard =
    userWebsearchSources.length > 0 && (!isLoading || !isLastNonUser) ? (
      <div
        className="relative flex flex-wrap text-ellipsis gap-2 self-end mt-1 mb-2 w-[70%]"
        dir="rtl"
      >
        {userWebsearchSources.map((source, sourceIndex) => {
          return (
            <Citation className="p-0" key={`user-link-${index}-${sourceIndex}`} source={source} />
          );
        })}
      </div>
    ) : null;

  const maybeAssistantSources =
    assistantWebsearchSources.length > 0 ? (
      <WebSearchSourcesPanel
        sources={assistantWebsearchSources}
        isOpen={isAssistantSourcesOpen}
        onToggle={toggleOpen}
        panelId={`assistant-web-sources-${children.id}`}
        panelRef={panelRef}
      />
    ) : null;

  const margin =
    allFiles !== undefined ||
    userWebsearchSources.length > 0 ||
    assistantWebsearchSources.length > 0
      ? 'm-0 mt-4'
      : 'm-4';

  const maybeShowMessageIcons =
    isLastNonUser && status !== 'streaming' ? (
      <div className="flex items-center gap-1 mt-1">
        <TelliClipboardButton text={children.content} className="w-5 h-5" />
        <button
          title={tCommon('regenerate-message')}
          type="button"
          onClick={() => regenerateMessage()}
          aria-label="Reload"
        >
          <div className={cn('p-1.5 rounded-enterprise-sm', iconClassName)}>
            <ReloadIcon className="w-5 h-5" />
          </div>
        </button>
        {assistantWebsearchSources.length > 0 && (
          <WebSearchSourcesButton
            isOpen={isAssistantSourcesOpen}
            panelId={`assistant-web-sources-${children.id}`}
            onClick={openOrScrollIntoView}
          />
        )}
      </div>
    ) : null;

  const messageContent = <MarkdownDisplay>{children.content}</MarkdownDisplay>;

  return (
    <>
      <div key={index} className={cn('w-full', userClassName, margin)}>
        <div aria-label={`${children.role} message ${Math.floor(index / 2 + 1)}`}>
          <div className={cn('flex', isAtLeast.sm ? 'flex-row' : 'flex-col')}>
            {children.role === 'assistant' && assistantIcon}
            <div
              className={cn(
                'flex flex-col items-start gap-2',
                children.role === 'assistant' && 'w-full',
              )}
            >
              {maybeAssistantSources}
              {messageContent}
              {maybeShowMessageIcons}
            </div>
          </div>
        </div>
      </div>
      {maybeUserWebpageCard}
      {maybeFileAttachment}
    </>
  );
}
