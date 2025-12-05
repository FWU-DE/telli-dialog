import { characterAccessLevelSchema } from '@shared/db/schema';
import Page2 from './_page';
import { enrichGptWithImage } from './utils';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { getCustomGptByAccessLevel } from '@shared/custom-gpt/custom-gpt-service';

export const dynamic = 'force-dynamic';

export const searchParamsSchema = z.object({
  visibility: characterAccessLevelSchema.optional().default('private'),
});

export default async function Page(props: PageProps<'/custom'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const accessLevel = searchParams.visibility;
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const _customGpts = await getCustomGptByAccessLevel({
    accessLevel,
    schoolId: school.id,
    userId: user.id,
    federalStateId: federalState.id,
  });
  const customGpts = _customGpts.filter((c) => c.name !== '');

  const enrichedCustomGpts = await enrichGptWithImage({ customGpts });

  return <Page2 user={userAndContext} customGpts={enrichedCustomGpts} accessLevel={accessLevel} />;
}
