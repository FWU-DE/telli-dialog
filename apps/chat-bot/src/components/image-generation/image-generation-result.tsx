import { useTranslations } from 'next-intl';
import { FileModel } from '@shared/db/schema';
import MessageImageAttachment from '../chat/message-image-attachment';
import { CopyPromptButton } from './copy-prompt-button';

export function ImageGenerationResult({
  prompt,
  attachedFiles,
  children,
}: {
  prompt: string;
  attachedFiles: FileModel[];
  children: React.ReactNode;
}) {
  const tImageGeneration = useTranslations('image-generation');

  return (
    <div className="mt-6">
      <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
      <p className="text-sm mb-3">
        {prompt}
        <CopyPromptButton prompt={prompt} />
      </p>
      <h3 className="text-xs text-gray-700">{tImageGeneration('attached-files-label')}</h3>
      {attachedFiles.length > 0 && (
        <div className="flex flex-row gap-2 overflow-auto mt-2 mb-5">
          {attachedFiles.map((file) => (
            <MessageImageAttachment key={file.id} file={file} width={56} height={56} />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
