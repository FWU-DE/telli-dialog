import { getCharacterForEditView } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { WebsearchSource } from '@shared/db/types';
import { CharacterView } from './character-view';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/characters/[characterId]'>) {
  const { characterId } = await props.params;
  const { user } = await requireAuth();

  const { character, relatedFiles, maybeSignedPictureUrl } = await getCharacterForEditView({
    characterId,
    user,
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
    <DefaultPageLayout>
      <CharacterView
        character={character}
        relatedFiles={relatedFiles}
        initialLinks={initialLinks}
        avatarPictureUrl={maybeSignedPictureUrl}
      />
    </DefaultPageLayout>
  );
}
