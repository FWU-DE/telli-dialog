import { getUser } from '@/auth/utils';
import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import {
  dbGetCharacterByIdWithShareData,
  dbGetCopyTemplateCharacter,
} from '@shared/db/functions/character';
import { getMaybeSignedUrlFromS3Get, readFileFromS3 } from '@shared/s3';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../../header-portal';
import CharacterForm from './character-form';
import { removeNullValues } from '@/utils/generic/object-operations';
import { CharacterModel } from '@shared/db/schema';
import { fetchFileMapping, linkFileToCharacter } from '../../actions';
import { webScraperExecutable } from '@/app/api/conversation/tools/websearch/search-web';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { dbGetRelatedCharacterFiles } from '@shared/db/functions/files';
import { handleFileUpload } from '@/app/api/v1/files/route';

export const dynamic = 'force-dynamic';
const PREFETCH_ENABLED = false;

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

  const templateCharacter =
    templateId !== undefined
      ? await dbGetCharacterByIdWithShareData({
          characterId: templateId,
          userId: user.id,
        })
      : undefined;

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
  if (templateId !== undefined) {
    const templateFiles = await dbGetRelatedCharacterFiles(templateId);
    await Promise.all(
      templateFiles.map(async (file) => {
        try {
          const fileContent = await readFileFromS3({ key: `message_attachments/${file.id}` });
          const blobFile = new File([fileContent], file.name, { type: file.type });
          const fileId = await handleFileUpload(blobFile);
          await linkFileToCharacter({ fileId: fileId, characterId: character.id });
          relatedFiles.push({ ...file, id: fileId });
        } catch (e) {
          console.error('Error copying file from template to character:', e);
        }
      }),
    );
  }
  if (!character) {
    return notFound();
  }
  const readOnly = user.id !== character.userId;
  let maybeSignedPictureUrl: string | undefined;
  try {
    maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({
      key: character.pictureId ?? copyOfTemplatePicture,
    });
  } catch (e) {
    console.error('Error getting signed picture URL:', e);
  }

  const links = character.attachedLinks.concat(templateCharacter?.attachedLinks || []);

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
          initialLinks={initialLinks}
          readOnly={readOnly}
          templateCharacterId={templateId}
        />
      </div>
    </div>
  );
}
