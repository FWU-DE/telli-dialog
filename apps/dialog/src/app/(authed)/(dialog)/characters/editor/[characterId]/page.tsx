import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import HeaderPortal from '../../../header-portal';
import CharacterForm from './character-form';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { CharacterWithShareDataModel } from '@shared/db/schema';
import { webScraperExecutable } from '@/app/api/conversation/tools/websearch/search-web';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { getCharacterForEditView } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';

export const dynamic = 'force-dynamic';
const PREFETCH_ENABLED = false;

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
  const links = character.attachedLinks;

  const initialLinks = PREFETCH_ENABLED
    ? await Promise.all(links.filter((l) => l !== '').map((url) => webScraperExecutable(url)))
    : links
        .filter((l) => l !== '')
        .map(
          (url) =>
            ({
              link: url,
              type: 'websearch',
              error: false,
            }) as WebsearchSource,
        );

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
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
