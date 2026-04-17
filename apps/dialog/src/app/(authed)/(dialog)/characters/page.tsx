import { accessLevelSchema } from '@shared/db/schema';
import CharacterPreviewPage from './character-preview-page';
import { enrichCharactersWithImage } from './utils';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { getCharacterByAccessLevel } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import CharacterOverview from './character-overview';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  visibility: accessLevelSchema.optional().default('private'),
});

export default async function Page(props: PageProps<'/characters'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);
  const isNewUi = federalState.featureToggles.isNewUiDesignEnabled;

  if (isNewUi) {
    return (
      <DefaultPageLayout>
        <CustomChatHeader
          userAndContext={userAndContext}
          isNewUiDesignEnabled={federalState.featureToggles.isNewUiDesignEnabled}
        />

        <CharacterOverview currentUserId={user.id} />
      </DefaultPageLayout>
    );
  }

  const accessLevel = searchParams.visibility;
  const _characters = await getCharacterByAccessLevel({
    accessLevel,
    schoolId: school.id,
    userId: user.id,
    federalStateId: federalState.id,
  });
  const characters = _characters.filter((c) => c.name !== '');
  const enrichedCharacters = await enrichCharactersWithImage({ characters });

  return (
    <CharacterPreviewPage
      user={userAndContext}
      characters={enrichedCharacters}
      accessLevel={accessLevel}
    />
  );
}
