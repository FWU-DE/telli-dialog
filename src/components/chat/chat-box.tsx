import { FileModel } from '@/db/schema';
import DisplayUploadedFile from './display-uploaded-file';
import type { UIMessage } from '@ai-sdk/ui-utils';
import TelliClipboardButton from '../common/clipboard-button';
import ReloadIcon from '../icons/reload';
import MarkdownDisplay from './markdown-display';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';
import { parseHyperlinks } from '@/utils/chat';
import { WebpageCard } from './webpage-card';
import Citation from './sources/citation';

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
}) {
  let maybefileAttachment: React.JSX.Element | undefined = undefined;
  const tCommon = useTranslations('common');
  const userClassName =
    children.role === 'user'
      ? 'w-fit p-4 rounded-2xl rounded-br-none self-end bg-secondary/20 text-primary-foreground max-w-[70%] break-words'
      : '';
  const fileMatch = fileMapping?.get(children.id) !== undefined;
  const allFiles = fileMatch ? fileMapping.get(children.id) : initialFiles;

  const margin = allFiles !== undefined ? 'm-0' : 'm-4';

  if (allFiles !== undefined && children.role === 'user' && (isLastUser || fileMatch)) {
    maybefileAttachment = (
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
    );
  }
  const urls = parseHyperlinks(children.content);
  const maybeWebpageCard = urls ? 
    <div className="relative flex flex-row gap-2 pb-0 pt-0 overflow-auto self-end mb-4">
      {urls.map((url, index) => {
        return <Citation key={`user-link-${index}`} source={{ name: url, link: url, content: '' }} />;
      })}
    </div> : null;

  let maybeShowMessageIcons = null;
  if (isLastNonUser && !isLoading) {
    maybeShowMessageIcons = (
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
    );
  }

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
