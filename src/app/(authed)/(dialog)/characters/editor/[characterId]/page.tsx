import { getUser } from '@/auth/utils';
import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import {
  dbGetCharacterByIdWithShareData,
  dbGetCopyTemplateCharacter,
} from '@/db/functions/character';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../../header-portal';
import CharacterForm from './character-form';
import { removeNullValues } from '@/utils/generic/object-operations';
import { CharacterModel } from '@/db/schema';
import { fetchFileMapping } from '../../actions';

export const dynamic = 'force-dynamic';

async function getMaybeDefaultTemplateCharater({
  templateId,
  characterId,
  userId,
}: {
  templateId?: string;
  characterId: string;
  userId: string;
}) {
  if (templateId === undefined) return undefined;
  return await dbGetCopyTemplateCharacter({
    templateId,
    characterId: characterId,
    userId: userId,
  });
}

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
  const templateId = searchParams?.templateId;
  const user = await getUser();

  const character = await dbGetCharacterByIdWithShareData({
    characterId: params.characterId,
    userId: user.id,
  });
  if (character === undefined) return notFound();

  const defaultTemplateCharacter = await getMaybeDefaultTemplateCharater({
    templateId: templateId,
    characterId: character.id,
    userId: user.id,
  });
  const copyOfTemplatePicture =
    templateId !== undefined ? `characters/${character.id}/avatar` : undefined;

  const relatedFiles = await fetchFileMapping(params.characterId);
  if (!character) {
    return notFound();
  }
  const readOnly = user.id !== character.userId;
  const maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({
    key: character.pictureId ?? copyOfTemplatePicture,
  });

  const mergedCharacter = {
    ...removeNullValues(character),
    ...removeNullValues(defaultTemplateCharacter),
    modelId: character.modelId,
  } as CharacterModel;

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <CharacterForm
          {...mergedCharacter}
          pictureId={character.pictureId}
          maybeSignedPictureUrl={maybeSignedPictureUrl}
          isCreating={isCreating}
          existingFiles={relatedFiles}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
