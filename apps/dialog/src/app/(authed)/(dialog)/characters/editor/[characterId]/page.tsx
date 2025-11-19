import { getUser } from '@/auth/utils';
import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetCharacterByIdWithShareData } from '@shared/db/functions/character';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../../header-portal';
import CharacterForm from './character-form';
import { removeNullishValues } from '@/utils/generic/object-operations';
import { CharacterModel } from '@shared/db/schema';
import { fetchFileMappingAction } from '../../actions';
import { webScraperExecutable } from '@/app/api/conversation/tools/websearch/search-web';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { logError } from '@shared/logging';

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
  const user = await getUser();

  const character = await dbGetCharacterByIdWithShareData({
    characterId: params.characterId,
    userId: user.id,
  });
  if (character === undefined) return notFound();
  const relatedFiles = await fetchFileMappingAction(params.characterId);
  if (!character) {
    return notFound();
  }
  const readOnly = user.id !== character.userId;
  let maybeSignedPictureUrl: string | undefined;
  try {
    maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({
      key: character.pictureId,
    });
  } catch (e) {
    logError(
      `Error getting signed picture URL (key: ${character.pictureId}, character id: ${character.id}, template id: ${searchParams?.templateId})`,
      e,
    );
  }

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
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <CharacterForm
          {...(removeNullishValues(character) as CharacterModel)}
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
