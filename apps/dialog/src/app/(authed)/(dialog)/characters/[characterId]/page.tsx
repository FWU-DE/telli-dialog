import { getCharacterForEditView } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { WebsearchSource } from '@shared/db/types';
import { CharacterView } from './character-view';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/characters/[characterId]'>) {
  const { characterId } = await props.params;
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
    hasApiKeyAssigned: federalState.hasApiKeyAssigned,
  };

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

  return (
    <DefaultPageLayout userAndContext={userAndContext}>
      <CharacterView
        character={character}
        relatedFiles={relatedFiles}
        initialLinks={initialLinks}
        avatarPictureUrl={maybeSignedPictureUrl}
      />
    </DefaultPageLayout>
  );
}
