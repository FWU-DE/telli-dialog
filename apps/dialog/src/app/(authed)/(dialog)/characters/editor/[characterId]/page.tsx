import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../../header-portal';
import CharacterForm from './character-form';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { CharacterSelectModel } from '@shared/db/schema';
import { webScraperExecutable } from '@/app/api/conversation/tools/websearch/search-web';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { getCharacterForEditView } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';

export const dynamic = 'force-dynamic';
const PREFETCH_ENABLED = false;

const pageContextSchema = z.object({
  params: z.object({
    characterId: z.string(),
  }),
  searchParams: z
    .object({
      create: z.string().optional(),
      templateId: z.string().optional(),
    })
    .optional(),
});

export default async function Page(context: PageContext) {
  const result = pageContextSchema.safeParse(await awaitPageContext(context));
  if (!result.success) notFound();
  const { params, searchParams } = result.data;
  const isCreating = searchParams?.create === 'true';
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const { character, relatedFiles, maybeSignedPictureUrl } = await getCharacterForEditView({
    characterId: params.characterId,
    userId: user.id,
    schoolId: school.id,
  }).catch(() => {
    notFound();
  });

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
        <ProfileMenu {...userAndContext} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <CharacterForm
          {...(removeNullishValues(character) as CharacterSelectModel)}
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
