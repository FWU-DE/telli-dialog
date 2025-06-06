import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { CreateNewCharacterFromTemplate } from '../characters/create-new-character-button';
import { calculateTimeLeftBySharedChat } from '../shared-chats/[sharedSchoolChatId]/utils';
import { createNewCharacterAction } from '../characters/actions';
import { createNewCustomGptAction } from '../custom/actions';

export function CopyContainer({
  templateId,
  templatePictureId,
  startedAt,
  maxUsageTimeLimit,
  translation,
  redirectPath,
}: {
  templateId: string;
  templatePictureId?: string;
  startedAt: Date | null;
  maxUsageTimeLimit: number | null;
  translation: (key: string) => string;
  redirectPath: 'characters' | 'custom';
}) {
  const sharedChatTimeLeft = calculateTimeLeftBySharedChat({ startedAt, maxUsageTimeLimit });
  const sharedChatActive = sharedChatTimeLeft > 0;
  const containerBg = !sharedChatActive ? 'bg-secondary/10' : 'bg-gray-100/10';
  const createInstanceCallback =
    redirectPath === 'characters' ? createNewCharacterAction : createNewCustomGptAction;

  return (
    <CreateNewCharacterFromTemplate
      templateId={templateId}
      templatePictureId={templatePictureId}
      redirectPath={redirectPath}
      createInstanceCallback={createInstanceCallback}
    >
      <div
        className={cn(
          'flex flex-col gap-4 border-[1px] rounded-enterprise-md border-gray-200 p-6',
          containerBg,
        )}
      >
        <h2 className="font-medium">{translation('copy-page.title')}</h2>
        <div>{translation('copy-page.content')}</div>
        <button
          disabled={sharedChatActive}
          title={translation('copy-page.copy-template')}
          className={cn(
            buttonPrimaryClassName,
            'min-w-max max-w-min h-11 flex gap-2 items-center group self-end',
          )}
          type="button"
        >
          <span>{translation('copy-page.copy-template')}</span>
        </button>
      </div>
    </CreateNewCharacterFromTemplate>
  );
}
