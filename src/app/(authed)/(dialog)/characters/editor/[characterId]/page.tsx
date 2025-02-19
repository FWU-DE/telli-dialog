import HeaderPortal from '../../../header-portal';
import ProfileMenu from '@/components/navigation/profile-menu';
import { dbGetCharacterByIdOrSchoolId } from '@/db/functions/character';
import { getUser } from '@/auth/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import CharacterForm from './character-form';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import React from 'react';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';

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

async function safeParse(context: {
  params: Promise<{ characterId: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const resolvedParams = await context.params;
  const resolvedSearchParams = await context.searchParams;
  const parseResult = pageContextSchema.safeParse({
    params: resolvedParams,
    searchParams: resolvedSearchParams,
  });

  if (parseResult.success) {
    return parseResult.data;
  }

  return notFound();
}

export default async function Page(context: {
  params: Promise<{ characterId: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const { params, searchParams } = await safeParse(context);

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
    <div className="min-w-full p-4 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-4xl mx-auto mt-4">
        <CharacterForm
          {...character}
          maybeSignedPictureUrl={maybeSignedPictureUrl}
          isCreating={isCreating}
        />
      </div>
    </div>
  );
}
