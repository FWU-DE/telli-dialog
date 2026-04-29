import { getCharacterForEditView } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { WebsearchSource } from '@shared/db/types';
import { CharacterEdit } from './character-edit';
import { redirect } from 'next/navigation';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/characters/editor/[characterId]'>) {
  const { characterId } = await props.params;
  const { user } = await requireAuth();

  const { character, relatedFiles, maybeSignedPictureUrl } = await getCharacterForEditView({
    characterId,
    userId: user.id,
    schoolIds: user.schoolIds ?? [],
  }).catch(handleErrorInServerComponent);

  const initialLinks = character.attachedLinks
    .filter((l) => l !== '')
    .map(
      (url) =>
        ({
          link: url,
          error: false,
        }) as WebsearchSource,
    );

  const readOnly = user.id !== character.userId;

  if (readOnly) {
    redirect(`/characters/${characterId}`);
  }

  return (
    <DefaultPageLayout header={{ headerType: 'form' }}>
      <CharacterEdit
        character={character}
        relatedFiles={relatedFiles}
        initialLinks={initialLinks}
        avatarPictureUrl={maybeSignedPictureUrl}
      />
    </DefaultPageLayout>
  );
}
