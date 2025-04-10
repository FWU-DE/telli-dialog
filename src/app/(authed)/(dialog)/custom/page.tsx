import { z } from 'zod';
import {
  type CharacterAccessLevel,
  type CharacterModel,
  CustomGptModel,
  characterAccessLevelSchema,
} from '@/db/schema';
import { redirect } from 'next/navigation';
import { getUser } from '@/auth/utils';
import React from 'react';
import { buildCharactersUrl, enrichCharactersWithImage } from '../characters/utils';
import Page2 from './_page';
import { dbGetGlobalGpts, dbGetGptsBySchoolId, dbGetGptsByUserId } from '@/db/functions/custom-gpts';
import { enrichGptWithImage } from './utils';



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

  return redirect(buildCharactersUrl('global', 'custom'));
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

  const enrichedCharacters = await enrichGptWithImage({ characters });

  return <Page2 user={user} customGpts={enrichedCharacters} accessLevel={accessLevel} />;
}

async function getCharacterByAccessLevel({
  accessLevel,
  schoolId,
  userId,
}: {
  accessLevel: CharacterAccessLevel;
  schoolId: string | undefined;
  userId: string;
}): Promise<CustomGptModel[]> {
  
  if (accessLevel === 'global') {
    return await dbGetGlobalGpts();
  }

  if (accessLevel === 'school' && schoolId !== undefined) {
    return await dbGetGptsBySchoolId({ schoolId });
  }

  if (accessLevel === 'private') {
    return await dbGetGptsByUserId({ userId });
  }

  return [];
}
