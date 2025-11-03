import { FileModel } from '@shared/db/schema';
import DisplayUploadedFile from './display-uploaded-file';
import DisplayUploadedImage from './display-uploaded-image';
import TelliClipboardButton from '../common/clipboard-button';
import ReloadIcon from '../icons/reload';
import MarkdownDisplay from './markdown-display';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';
import Citation from './sources/citation';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { parseHyperlinks } from '@/utils/web-search/parsing';
import { iconClassName } from '@/utils/tailwind/icon';
import useBreakpoints from '../hooks/use-breakpoints';
import { isImageFile } from '@/utils/files/generic';
import { UIMessage } from 'ai';
import { ReactNode, useMemo } from 'react';
import { UseChatHelpers } from '@ai-sdk/react';

export function ChatBox({
  assistantIcon,
  children,
  fileMapping,
  index,
  initialFiles,
  initialWebsources,
  isLastNonUser,
  isLastUser,
  isLoading,
  regenerateMessage,
  status,
}: {
  assistantIcon?: ReactNode;
  children: UIMessage;
  fileMapping?: Map<string, FileModel[]>;
  index: number;
  initialFiles?: FileModel[];
  initialWebsources?: WebsearchSource[];
  isLastNonUser: boolean;
  isLastUser?: boolean;
  isLoading: boolean;
  regenerateMessage: () => void;
  status: UseChatHelpers['status'];
}) {
  const tCommon = useTranslations('common');
  const { isAtLeast } = useBreakpoints();

  const isFinished = useMemo(() => status !== 'streaming', [status]);

  const userClassName =
    children.role === 'user'
      ? 'w-fit p-4 rounded-2xl rounded-br-none self-end bg-secondary-light text-primary-foreground max-w-[70%] break-words'
      : 'w-fit';
  const fileMatch = fileMapping?.get(children.id) !== undefined;
  const allFiles = fileMatch ? fileMapping.get(children.id) : initialFiles;
  const urls = parseHyperlinks(children.content) ?? [];
  const websearchSources = [...(initialWebsources ?? [])];

  for (const url of urls) {
    if (websearchSources.find((source) => source.link === url) === undefined) {
      websearchSources.push({ link: url, type: 'websearch' });
    }
  }

  // Separate image files from non-image files
  const imageFiles = allFiles?.filter((file) => isImageFile(file.name)) ?? [];
  const nonImageFiles = allFiles?.filter((file) => !isImageFile(file.name)) ?? [];

  const maybefileAttachment =
    allFiles !== undefined && children.role === 'user' && (isLastUser || fileMatch) ? (
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

  const maybeWebpageCard =
    websearchSources.length > 0 && (!isLoading || !isLastNonUser) ? (
      <div
        className="relative flex flex-wrap overflow-ellipsis gap-2 self-end mt-1 mb-2 w-[70%]"
        dir="rtl"
      >
        {websearchSources?.map((source, sourceIndex) => {
          return (
            <Citation
              className="bg-secondary-dark rounded-enterprise-sm p-0"
              key={`user-link-${index}-${sourceIndex}`}
              source={source}
              index={index}
              sourceIndex={sourceIndex}
            />
          );
        })}
      </div>
    ) : null;

  const webSourceAvailable = initialWebsources !== undefined && initialWebsources.length !== 0;
  const margin = allFiles !== undefined || webSourceAvailable ? 'm-0 mt-4' : 'm-4';

  const maybeShowMessageIcons =
    isLastNonUser && isFinished ? (
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
      </div>
    ) : null;

  const messageContent = <MarkdownDisplay>{children.content}</MarkdownDisplay>;

  return (
    <>
      <div key={index} className={cn('w-full text-secondary-foreground', userClassName, margin)}>
        <div className="" aria-label={`${children.role} message ${Math.floor(index / 2 + 1)}`}>
          <div className={cn('flex flex-row', isAtLeast.sm ? 'flex-row' : 'flex-col')}>
            {children.role === 'assistant' && assistantIcon}
            <div className="flex flex-col items-start gap-2">
              {messageContent}
              {maybeShowMessageIcons}
            </div>
          </div>
        </div>
      </div>
      {maybeWebpageCard}
      {maybefileAttachment}
    </>
  );
}
