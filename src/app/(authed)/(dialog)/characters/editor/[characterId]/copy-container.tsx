import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { useTranslations } from 'next-intl';
import { CreateNewCharacterFromTemplate } from '../../create-new-character-button';
import { CharacterModel } from '@/db/schema';
import { calculateTimeLeftBySharedChat } from '../../../shared-chats/[sharedSchoolChatId]/utils';

export function CopyContainer({ character }: { character: CharacterModel }) {
  const t = useTranslations('characters.copy-page');
  const sharedChatTimeLeft = calculateTimeLeftBySharedChat(character);
  const sharedChatActive = sharedChatTimeLeft > 0;
  const containerBg = !sharedChatActive ? 'bg-secondary/10' : 'bg-gray-100/10';
  return (
    <CreateNewCharacterFromTemplate
      templateId={character.id}
      templatePictureId={character.pictureId ?? undefined}
    >
      <div
        className={cn(
          'flex flex-col gap-4 border-[1px] rounded-enterprise-md border-gray-200 p-6',
          containerBg,
        )}
      >
        <h2 className="font-medium">{t('title')}</h2>
        <div>{t('content')}</div>
        <button
          disabled={sharedChatActive}
          title={t('copy-template')}
          className={cn(
            buttonPrimaryClassName,
            'min-w-max max-w-min h-11 flex gap-2 items-center group self-end',
          )}
          type="button"
        >
          <span>{t('copy-template')}</span>
        </button>
      </div>
    </CreateNewCharacterFromTemplate>
  );
}
