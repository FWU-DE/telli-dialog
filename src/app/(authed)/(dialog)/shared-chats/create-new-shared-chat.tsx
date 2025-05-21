import PlusIcon from '@/components/icons/plus';
import { cn } from '@/utils/tailwind';

import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { createNewSharedSchoolChatAction } from './create/actions';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/common/toast';
import { useRouter } from 'next/navigation';

export function CreateNewSharedChatButton() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('shared-chats');

  const { models } = useLlmModels();

  const maybeDefaultModelId =
    models.find((m) => m.name === DEFAULT_CHAT_MODEL)?.id ?? models[0]?.id;

  function handleNewGPT() {
    if (maybeDefaultModelId === undefined) {
      throw new Error('No default model found');
    }
    createNewSharedSchoolChatAction({ modelId: maybeDefaultModelId, name: '' })
      .then((newCharacter) => {
        router.push(`/shared-chats/${newCharacter.id}?create=true`);
      })
      .catch(() => {
        toast.error(t('toasts.create-toast-error'));
      });
  }

  return (
    <button
      onClick={handleNewGPT}
      className={cn(buttonPrimaryClassName, 'flex gap-2 items-center group py-2')}
    >
      <PlusIcon className="fill-button-primary-text group-hover:fill-secondary-text" />
      <span>{t('form.button-create')}</span>
    </button>
  );
}
