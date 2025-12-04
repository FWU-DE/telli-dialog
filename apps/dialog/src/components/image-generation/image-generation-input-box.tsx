import { useTranslations } from 'next-intl';
import AutoResizeTextarea from '../common/auto-resize-textarea';
import { CHAT_MESSAGE_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { cn } from '@/utils/tailwind';

export function ImageGenerationInputBox({
  isLoading,
  handleInputChange,
  customHandleSubmit,
  input,
}: {
  isLoading: boolean;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  customHandleSubmit: (e: FormEvent) => Promise<void>;
  input: string;
}) {
  const tImageGeneration = useTranslations('image-generation');

  return (
    <>
      <div className="relative bg-white w-full p-3 border focus-within:border-primary rounded-xl">
        <AutoResizeTextarea
          autoFocus
          placeholder={tImageGeneration('placeholder')}
          className="w-full text-base focus:outline-none bg-transparent max-h-[10rem] sm:max-h-[15rem] overflow-y-auto placeholder-black py-3 px-4"
          onChange={handleInputChange}
          value={input}
          maxLength={CHAT_MESSAGE_LENGTH_LIMIT}
        />
      </div>
      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={customHandleSubmit}
          disabled={input.trim().length === 0 || isLoading}
          className={cn(
            'bg-primary disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-full transition-colors',
          )}
          aria-label={tImageGeneration('generate-button')}
        >
          {tImageGeneration('generate-button')}
        </button>
      </div>
    </>
  );
}
