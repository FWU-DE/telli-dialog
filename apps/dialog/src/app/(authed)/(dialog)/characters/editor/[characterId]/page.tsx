import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import HeaderPortal from '../../../header-portal';
import CharacterForm from './character-form';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { CharacterWithShareDataModel } from '@shared/db/schema';
import { getCharacterForEditView } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { WebsearchSource } from '@shared/db/types';
import { ResponsiveLayoutWrapper } from '../../../_components/responsive-layout-wrapper';
import { CharacterEdit } from './character-edit';
import { CharacterView } from './character-view';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  create: z.string().optional().default('false'),
});

export default async function Page(props: PageProps<'/characters/editor/[characterId]'>) {
  const { characterId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const isCreating = searchParams.create === 'true';

  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const { character, relatedFiles, maybeSignedPictureUrl } = await getCharacterForEditView({
    characterId,
    userId: user.id,
    schoolId: school.id,
  }).catch(handleErrorInServerComponent);

  const readOnly = user.id !== character.userId;
  const initialLinks = character.attachedLinks
    .filter((l) => l !== '')
    .map(
      (url) =>
        ({
          link: url,
          error: false,
        }) as WebsearchSource,
    );

  if (federalState.featureToggles.isNewUiDesignEnabled && !readOnly) {
    return (
      <ResponsiveLayoutWrapper>
        <CustomChatHeader
          userAndContext={userAndContext}
          isNewUiDesignEnabled={federalState.featureToggles.isNewUiDesignEnabled}
        />
        <CharacterEdit
          character={character}
          relatedFiles={relatedFiles}
          initialLinks={initialLinks}
          avatarPictureUrl={maybeSignedPictureUrl}
        />
      </ResponsiveLayoutWrapper>
    );
  }

  if (federalState.featureToggles.isNewUiDesignEnabled && readOnly) {
    return (
      <ResponsiveLayoutWrapper>
        <CharacterView
          character={character}
          relatedFiles={relatedFiles}
          initialLinks={initialLinks}
          avatarPictureUrl={maybeSignedPictureUrl}
        />
      </ResponsiveLayoutWrapper>
    );
  }

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton
          isNewUiDesignEnabled={federalState.featureToggles.isNewUiDesignEnabled}
        />
        <div className="grow"></div>
        <ProfileMenu userAndContext={userAndContext} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <CharacterForm
          {...(removeNullishValues(character) as CharacterWithShareDataModel)}
          pictureId={character.pictureId}
          maybeSignedPictureUrl={maybeSignedPictureUrl}
          isCreating={isCreating}
          existingFiles={relatedFiles}
          initialLinks={initialLinks}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
