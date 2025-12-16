import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { useTranslations } from 'next-intl';
import { CreateNewCharacterFromTemplate } from '../../create-new-character-button';
import { CharacterSelectModel } from '@shared/db/schema';
import { createNewCharacterAction } from '../../actions';
import { calculateTimeLeftForLearningScenario } from '@shared/learning-scenarios/learning-scenario-service.client';

export function CopyContainer({ character }: { character: CharacterSelectModel }) {
  const t = useTranslations('characters.form.copy-page');
  const sharedChatTimeLeft =
    'startedAt' in character && 'maxUsageTimeLimit' in character
      ? calculateTimeLeftForLearningScenario({
          startedAt: character.startedAt as Date | null,
          maxUsageTimeLimit: character.maxUsageTimeLimit as number | null,
        })
      : 0;
  const sharedChatActive = sharedChatTimeLeft > 0;
  const containerBg = !sharedChatActive ? 'bg-secondary/10' : 'bg-gray-100/10';
  return (
    <CreateNewCharacterFromTemplate
      templateId={character.id}
      templatePictureId={character.pictureId ?? undefined}
      redirectPath="characters"
      createInstanceCallback={createNewCharacterAction}
    >
      <div
        className={cn(
          'flex flex-col gap-4 border-[1px] mt-16 rounded-enterprise-md border-gray-200 p-6',
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
