import { FileModel } from '@/db/schema';
import DisplayUploadedFile from './display-uploaded-file';
import type { UIMessage } from '@ai-sdk/ui-utils';
import TelliClipboardButton from '../common/clipboard-button';
import ReloadIcon from '../icons/reload';
import MarkdownDisplay from './markdown-display';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';
import Citation from './sources/citation';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';

export function ChatBox({
  children,
  index,
  fileMapping,
  isLastUser,
  isLastNonUser,
  isLoading,
  regenerateMessage,
  initialFiles,
  assistantIcon,
  websearchSources,
}: {
  children: UIMessage;
  index: number;
  fileMapping?: Map<string, FileModel[]>;
  isLastUser?: boolean;
  isLastNonUser: boolean;
  isLoading: boolean;
  regenerateMessage: () => void;
  initialFiles?: FileModel[];
  assistantIcon?: React.JSX.Element;
  websearchSources?: WebsearchSource[];
}) {
  const tCommon = useTranslations('common');
  const userClassName =
    children.role === 'user'
      ? 'w-fit p-4 rounded-2xl rounded-br-none self-end bg-secondary/20 text-primary-foreground max-w-[70%] break-words'
      : '';
  const fileMatch = fileMapping?.get(children.id) !== undefined;
  const allFiles = fileMatch ? fileMapping.get(children.id) : initialFiles;

  const maybefileAttachment =
    allFiles !== undefined && children.role === 'user' && (isLastUser || fileMatch) ? (
      <div className="flex flex-row gap-2 pb-0 pt-0 overflow-auto self-end mb-4">
        {allFiles.map((file) => {
          return (
            <DisplayUploadedFile
              fileName={file.name}
              status="processed"
              key={file.id}
            ></DisplayUploadedFile>
          );
        })}
      </div>
    ) : null;

  const maybeWebpageCard =
    websearchSources && (!isLoading || !isLastNonUser) ? (
      <div
        className="relative flex flex-wrap overflow-ellipsis gap-2 self-end mt-1 w-[70%]"
        dir="rtl"
      >
        {websearchSources?.map((source, index) => {
          return <Citation key={`user-link-${index}`} source={source} />;
        })}
      </div>
    ) : null;
  const margin = allFiles !== undefined || websearchSources !== undefined ? 'm-0' : 'm-4';

  const maybeShowMessageIcons =
    isLastNonUser && !isLoading ? (
      <div className="flex items-center gap-1 mt-1">
        <TelliClipboardButton text={children.content} />
        <button
          title={tCommon('regenerate-message')}
          type="button"
          onClick={() => regenerateMessage()}
          aria-label="Reload"
        >
          <div className="p-1.5 rounded-enterprise-sm hover:bg-vidis-hover-green/20">
            <ReloadIcon className="text-primary w-5 h-5" />
          </div>
        </button>
      </div>
    ) : null;

  const messageContent = <MarkdownDisplay>{children.content}</MarkdownDisplay>;

  return (
    <>
      <div key={index} className={cn('w-full text-secondary-foreground', userClassName, margin)}>
        <div className="" aria-label={`${children.role} message ${Math.floor(index / 2 + 1)}`}>
          <div className="flex flex-row">
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
