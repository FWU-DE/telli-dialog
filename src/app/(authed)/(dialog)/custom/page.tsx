import { getUser } from '@/auth/utils';
import {
  dbGetGlobalGpts,
  dbGetGptsBySchoolId,
  dbGetGptsByUserId,
} from '@/db/functions/custom-gpts';
import { type CharacterAccessLevel, CustomGptModel, characterAccessLevelSchema } from '@/db/schema';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { z } from 'zod';
import Page2 from './_page';
import { enrichGptWithImage } from './utils';

export const dynamic = 'force-dynamic';

const pageContextSchema = z.object({
  searchParams: z.object({
    visibility: characterAccessLevelSchema.default('global'),
  }),
});

export default async function Page(context: PageContext) {
  const {
    searchParams: { visibility: accessLevel },
  } = pageContextSchema.parse(await awaitPageContext(context));
  const user = await getUser();

  const _customGpts = await getCustomGptByAccessLevel({
    accessLevel,
    schoolId: user.school?.id,
    userId: user.id,
  });
  const customGpts = _customGpts.filter((c) => c.name !== '');

  const enrichedCustomGpts = await enrichGptWithImage({ customGpts });

  return <Page2 user={user} customGpts={enrichedCustomGpts} accessLevel={accessLevel} />;
}

async function getCustomGptByAccessLevel({
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
