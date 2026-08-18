import { getTranslations } from 'next-intl/server';
import { requireAuth } from '@/auth/requireAuth';
import { getSharedCharacter } from '@shared/characters/character-service';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { notFound } from 'next/navigation';
import { calculateShareSessionState } from '@shared/sharing/calculate-share-session-state';
import { type Metadata } from 'next';
import CustomChatSharePage from '@/components/custom-chat/custom-chat-share-page';
import { Suspense } from 'react';
import { Spinner } from '@ui/components/spinner';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characters.page-titles');
  return {
    title: t('share'),
  };
}

export default function Page(props: PageProps<'/characters/editor/[characterId]/share'>) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Spinner className="size-8" />
        </div>
      }
    >
      <PageContent params={props.params} />
    </Suspense>
  );
}

async function PageContent({
  params: paramsPromise,
}: {
  params: PageProps<'/characters/editor/[characterId]/share'>['params'];
}) {
  const params = await paramsPromise;
  const { user } = await requireAuth();

  const character = await getSharedCharacter({
    userId: user.id,
    characterId: params.characterId,
  }).catch(handleErrorInServerComponent);

  if (!character.inviteCode) notFound();

  const inviteCode = character.inviteCode;
  const shareUrl = `/ua/characters/${character.id}/dialog?inviteCode=${inviteCode}`;
  const leftTime = calculateShareSessionState(character).timeLeftInSeconds;

  return (
    <CustomChatSharePage
      backHref={`/characters/editor/${character.id}`}
      customChatName={character.name}
      inviteCode={inviteCode}
      leftTimeInSeconds={leftTime}
      relativeShareUrl={shareUrl}
      totalTimeInSeconds={character.maxUsageTimeLimit * 60}
      customChatVariant="character"
      expiredAt={character.expiredAt}
      manuallyStoppedAt={character.manuallyStoppedAt}
      customChatId={character.id}
      sharingUserId={character.startedBy}
    />
  );
}
