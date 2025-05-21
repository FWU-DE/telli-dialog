import { useTranslations } from 'next-intl';
import AutoResizeTextarea from '../common/auto-resize-textarea';
import DisplayUploadedFile from './display-uploaded-file';
import { LocalFileState } from './send-message-form';
import {
  CHAT_MESSAGE_LENGTH_LIMIT,
  NUMBER_OF_FILES_LIMIT,
} from '@/configuration-text-inputs/const';
import StopIcon from '../icons/stop';
import ArrowRightIcon from '../icons/arrow-right';
import UploadFileButton from './upload-file-button';
import { iconClassName } from '@/utils/tailwind/icon';
import { cn } from '@/utils/tailwind';

export function ChatInputBox({
  files,
  setFiles,
  isLoading,
  handleDeattachFile,
  handleInputChange,
  handleStopGeneration,
  customHandleSubmit,
  input,
  enableFileUpload = false,
}: {
  files?: Map<string, LocalFileState>;
  setFiles?: React.Dispatch<React.SetStateAction<Map<string, LocalFileState>>>;
  isLoading: boolean;
  handleDeattachFile?: (localId: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleStopGeneration: () => void;
  customHandleSubmit: (e: React.FormEvent) => Promise<void>;
  input: string;
  enableFileUpload?: boolean;
}) {
  const tCommon = useTranslations('common');

  async function handleSubmitOnEnter(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !isLoading && !e.shiftKey) {
      e.preventDefault();
      if (e.currentTarget.value.trim().length > 0) {
        await customHandleSubmit(e);
      }
    }
  }

  /** Either Send or StopGeneration */
  const userActionButton = isLoading ? (
    <button
      type="button"
      title="Stop generating"
      onClick={handleStopGeneration}
      className={cn(
        'p-1.5 my-2 flex items-center justify-center group disabled:cursor-not-allowed me-2',
        iconClassName,
      )}
      aria-label="Stop"
    >
      <StopIcon className={cn('w-6 h-6')} />
    </button>
  ) : (
    <button
      type="submit"
      title="Send message"
      disabled={input.trim().length === 0}
      className={cn(
        iconClassName,
        'my-2 mx-2 flex items-center self-end justify-center group disabled:cursor-not-allowed text-dark-gray',
      )}
      aria-label="Send Message"
    >
      <ArrowRightIcon className={cn('h-9 w-9', iconClassName)} />
    </button>
  );

  return (
    <>
      <form
        onSubmit={customHandleSubmit}
        className="relative bg-white w-full p-1 border focus-within:border-primary rounded-xl"
      >
        {files !== undefined && handleDeattachFile !== undefined && files.size > 0 && (
          <div className="mx-2 py-2 flex gap-1 overflow-x-auto">
            {Array.from(files).map(([localId, file]) => (
              <DisplayUploadedFile
                fileName={file.file.name}
                key={localId}
                status={file.status}
                onDeattachFile={() => handleDeattachFile(localId)}
              />
            ))}
          </div>
        )}
        <div className="flex items-center">
          <AutoResizeTextarea
            autoFocus
            placeholder={tCommon('send-message-placeholder')}
            className="w-full text-base focus:outline-none bg-transparent max-h-[10rem] sm:max-h-[15rem] overflow-y-auto placeholder-black p-2"
            onChange={handleInputChange}
            value={input}
            onKeyDown={handleSubmitOnEnter}
            maxLength={CHAT_MESSAGE_LENGTH_LIMIT}
          />
          {enableFileUpload && files !== undefined && setFiles !== undefined && (
            <div className="flex flex-row gap-x-3">
              <UploadFileButton
                className={iconClassName}
                setFiles={setFiles}
                disabled={files.size >= NUMBER_OF_FILES_LIMIT}
              />
            </div>
          )}
          {userActionButton}
        </div>
      </form>
      <span className="text-xs mt-2 font-normal text-main-900 flex self-center text-center">
        {tCommon('information-disclaimer')}
      </span>
    </>
  );
}
