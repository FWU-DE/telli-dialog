import { CustomGptModel, FileModel } from '@/db/schema';
import DisplayUploadedFile from './display-uploaded-file';
import type { UIMessage } from '@ai-sdk/ui-utils';
import RobotIcon from '../icons/robot';
import TelliClipboardButton from '../common/clipboard-button';
import ReloadIcon from '../icons/reload';
import MarkdownDisplay from './markdown-display';
import { cn } from '@/utils/tailwind';

export function ChatBox({
  children,
  index,
  fileMapping,
  customGpt,
  isLastNonUser,
  isLoading,
  regenerateMessage,
  initialFiles,
}: {
  children: UIMessage;
  index: number;
  fileMapping?: Map<string, FileModel[]>;
  customGpt?: CustomGptModel;
  isLastNonUser: boolean;
  isLoading: boolean;
  regenerateMessage: () => void;
  initialFiles?: FileModel[];
}) {
  let maybefileAttachment: React.JSX.Element | undefined = undefined;

  const userClassName =
    children.role === 'user'
      ? 'w-fit p-4 rounded-2xl rounded-br-none self-end bg-secondary/20 text-primary-foreground max-w-[70%] break-words'
      : '';

  let allFiles: FileModel[] | undefined;

  if (fileMapping?.get(children.id) !== undefined) {
    allFiles = fileMapping?.get(children.id);
  } else if (initialFiles !== undefined) {
    allFiles = initialFiles;
  }

  const margin = allFiles !== undefined ? 'm-0' : 'm-4';

  if (allFiles !== undefined && children.role === 'user') {
    const filesElement = allFiles.map((file) => {
      return (
        <DisplayUploadedFile
          fileName={file.name}
          status="processed"
          key={file.id}
        ></DisplayUploadedFile>
      );
    });
    maybefileAttachment = (
      <div className="flex flex-row gap-2 pb-0 pt-0 overflow-auto self-end mb-4">
        {filesElement}
      </div>
    );
  }

  let assistantIcon = null;
  if (children.role === 'assistant' && customGpt?.name === 'Hilfe-Assistent') {
    assistantIcon = (
      <div className="p-1.5 rounded-enterprise-sm bg-secondary/5">
        <RobotIcon className="w-8 h-8 text-primary" />
      </div>
    );
  }
  let maybeShowMessageIcons = null;
  if (isLastNonUser && !isLoading) {
    maybeShowMessageIcons = (
      <div className="flex items-center gap-1 mt-1">
        <TelliClipboardButton text={children.content} />
        <button
          title="Reload last message"
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

  return (
    <>
      <div key={index} className={cn('w-full text-secondary-foreground', userClassName, margin)}>
        <div className="" aria-label={`${children.role} message ${Math.floor(index / 2 + 1)}`}>
          <div className="flex items-start gap-2">
            {assistantIcon}
            <MarkdownDisplay>{children.content}</MarkdownDisplay>
          </div>
          {maybeShowMessageIcons}
        </div>
      </div>
      {maybefileAttachment}
    </>
  );
}
