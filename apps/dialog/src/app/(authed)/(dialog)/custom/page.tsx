import { getUser } from '@/auth/utils';
import {
  dbGetGlobalGpts,
  dbGetGptsBySchoolId,
  dbGetGptsByUserId,
} from '@shared/db/functions/custom-gpts';
import {
  type CharacterAccessLevel,
  CustomGptModel,
  characterAccessLevelSchema,
} from '@shared/db/schema';
import Page2 from './_page';
import { enrichGptWithImage } from './utils';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';

export const dynamic = 'force-dynamic';

export const searchParamsSchema = z.object({
  visibility: characterAccessLevelSchema.optional().default('private'),
});

export default async function Page(props: PageProps<'/custom'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const accessLevel = searchParams.visibility;

  const user = await getUser();
  const _customGpts = await getCustomGptByAccessLevel({
    accessLevel,
    schoolId: user.school?.id,
    userId: user.id,
    federalStateId: user.federalState?.id,
  });
  const customGpts = _customGpts.filter((c) => c.name !== '');

  const enrichedCustomGpts = await enrichGptWithImage({ customGpts });

  return <Page2 user={user} customGpts={enrichedCustomGpts} accessLevel={accessLevel} />;
}

async function getCustomGptByAccessLevel({
  accessLevel,
  schoolId,
  userId,
  federalStateId,
}: {
  accessLevel: CharacterAccessLevel;
  schoolId: string | undefined;
  userId: string;
  federalStateId: string;
}): Promise<CustomGptModel[]> {
  if (accessLevel === 'global') {
    return await dbGetGlobalGpts({ federalStateId });
  }

  if (accessLevel === 'school' && schoolId !== undefined) {
    return await dbGetGptsBySchoolId({ schoolId });
  }

  if (accessLevel === 'private') {
    return await dbGetGptsByUserId({ userId });
  }

  return [];
}
