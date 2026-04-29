'use client';

import { BackButton } from '@/components/common/back-button';
import { CustomChatActionDuplicate } from '@/components/custom-chat/custom-chat-action-duplicate';
import { CustomChatActionUse } from '@/components/custom-chat/custom-chat-action-use';
import { CustomChatActions } from '@/components/custom-chat/custom-chat-actions';
import { CustomChatLayoutContainer } from '@/components/custom-chat/custom-chat-layout-container';
import { CustomChatTitle } from '@/components/custom-chat/custom-chat-title';
import { AssistantSelectModel, FileModel } from '@shared/db/schema';
import { useRouter } from 'next/navigation';
import { createNewAssistantAction, downloadFileFromAssistantAction } from '../actions';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { CustomChatLastUpdate } from '@/components/custom-chat/custom-chat-last-update';
import { Card, CardContent } from '@ui/components/Card';
import { CustomChatFields } from '@/components/custom-chat/custom-chat-fields';
import { CustomChatFieldInfo } from '@/components/custom-chat/custom-chat-field-info';
import { CustomChatAvatarImage } from '@/components/custom-chat/custom-chat-avatar-image';
import { CustomChatFilesAndLinks } from '@/components/custom-chat/custom-chat-files-and-links';

export function AssistantView({
  assistant,
  fileMappings,
  pictureUrl,
}: {
  assistant: AssistantSelectModel;
  fileMappings: FileModel[];
  pictureUrl: string | undefined;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('assistants');

  const handleDuplicateAssistant = async () => {
    const createResult = await createNewAssistantAction({
      templateId: assistant.id,
      duplicateAssistantName: t('duplicate-name-format-string', {
        sourceName: assistant.name,
      }),
    });
    if (createResult.success) {
      router.push(`/assistants/editor/${createResult.value.id}`);
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
  };

  async function handleDownloadFile(fileId: string) {
    return downloadFileFromAssistantAction({ assistantId: assistant.id, fileId });
  }

  return (
    <CustomChatLayoutContainer>
      <BackButton
        href="/custom"
        text={t('back-button-text')}
        aria-label={t('back-button-aria')}
        onClick={() => {
          router.push('/assistants');
        }}
      />
      <CustomChatTitle title={assistant.name} />
      <CustomChatActions>
        <CustomChatActionUse
          onClick={() => {
            router.push(`/assistants/d/${assistant.id}/`);
          }}
        />
        <CustomChatActionDuplicate onClick={handleDuplicateAssistant} />
        <CustomChatLastUpdate date={assistant.updatedAt} />
      </CustomChatActions>

      <Card>
        <CardContent className="flex justify-center items-center">
          <CustomChatAvatarImage pictureUrl={pictureUrl} />
        </CardContent>
      </Card>

      {assistant.accessLevel === 'global' && (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center">
            <div className="text-sm text-foreground/70">{t('author-label')}</div>
            <div className="text-base font-medium">{t('author-text')}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <CustomChatFields>
            <CustomChatFieldInfo label={t('name-label')} value={assistant.name} />
            <CustomChatFieldInfo label={t('description-label')} value={assistant.description} />
            <CustomChatFieldInfo label={t('instructions-label')} value={assistant.instructions} />
            {assistant.promptSuggestions.map((suggestion, index) => (
              <CustomChatFieldInfo
                key={index}
                label={`Promptvorschlag ${index + 1}`}
                value={suggestion}
              />
            ))}
          </CustomChatFields>
        </CardContent>
      </Card>

      <CustomChatFilesAndLinks
        initialFiles={fileMappings}
        initialLinks={assistant.attachedLinks.map((l) => ({ link: l }))}
        onDownloadFile={handleDownloadFile}
      />
    </CustomChatLayoutContainer>
  );
}
