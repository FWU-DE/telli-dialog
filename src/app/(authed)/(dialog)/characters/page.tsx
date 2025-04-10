import { z } from 'zod';
import {
  type CharacterAccessLevel,
  type CharacterModel,
  characterAccessLevelSchema,
} from '@/db/schema';
import { redirect } from 'next/navigation';
import { getUser } from '@/auth/utils';
import React from 'react';
import {
  dbGetCharactersBySchoolId,
  dbGetCharactersByUserId,
  dbGetGlobalCharacters,
} from '@/db/functions/character';
import { buildCharactersUrl, enrichCharactersWithImage } from './utils';
import Page2 from './_page';

export const dynamic = 'force-dynamic';

const pageContextSchema = z.object({
  searchParams: z.object({
    visibility: characterAccessLevelSchema.default('global'),
  }),
});

async function safeParse(context: { searchParams: Promise<{ visibility: string }> }) {
  const { searchParams } = context;
  const resolvedSearchParams = await searchParams;
  const parseResult = pageContextSchema.safeParse({ searchParams: resolvedSearchParams });

  if (parseResult.success) {
    return parseResult.data;
  }

  return redirect(buildCharactersUrl('global', 'characters'));
}

export default async function Page(context: { searchParams: Promise<{ visibility: string }> }) {
  const {
    searchParams: { visibility: accessLevel },
  } = await safeParse(context);

  const user = await getUser();

  const _characters = await getCharacterByAccessLevel({
    accessLevel,
    schoolId: user.school?.id,
    userId: user.id,
  });
  const characters = _characters.filter((c) => c.name !== '');

  const enrichedCharacters = await enrichCharactersWithImage({ characters });

  return <Page2 user={user} characters={enrichedCharacters} accessLevel={accessLevel} />;
}

async function getCharacterByAccessLevel({
  accessLevel,
  schoolId,
  userId,
}: {
  accessLevel: CharacterAccessLevel;
  schoolId: string | undefined;
  userId: string;
}): Promise<CharacterModel[]> {
  if (accessLevel === 'global') {
    return await dbGetGlobalCharacters();
  }

  if (accessLevel === 'school' && schoolId !== undefined) {
    return await dbGetCharactersBySchoolId({ schoolId });
  }

  if (accessLevel === 'private') {
    return await dbGetCharactersByUserId({ userId });
  }

  return [];
}
