import { getUser } from '@/auth/utils';
import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetCharacterByIdOrSchoolId } from '@/db/functions/character';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../../header-portal';
import CharacterForm from './character-form';

export const dynamic = 'force-dynamic';

const pageContextSchema = z.object({
  params: z.object({
    characterId: z.string(),
  }),
  searchParams: z
    .object({
      create: z.string().optional(),
    })
    .optional(),
});

export default async function Page(context: PageContext) {
  const result = pageContextSchema.safeParse(await awaitPageContext(context));
  if (!result.success) notFound();
  const { params, searchParams } = result.data;

  const isCreating = searchParams?.create === 'true';

  const user = await getUser();

  const character = await dbGetCharacterByIdOrSchoolId({
    characterId: params.characterId,
    userId: user.id,
    schoolId: user.school?.id ?? null,
  });

  if (!character) {
    return notFound();
  }

  const maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({ key: character.pictureId });

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <CharacterForm
          {...character}
          maybeSignedPictureUrl={maybeSignedPictureUrl}
          isCreating={isCreating}
        />
      </div>
    </div>
  );
}
