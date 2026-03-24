import { accessLevelSchema } from '@shared/db/schema';
import Page2 from './_page';
import { enrichAssistantsWithImage } from './utils';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { getAssistantByAccessLevel } from '@shared/custom-gpt/custom-gpt-service';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  visibility: accessLevelSchema.optional().default('private'),
});

export default async function Page(props: PageProps<'/custom'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const accessLevel = searchParams.visibility;
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const _assistants = await getAssistantByAccessLevel({
    accessLevel,
    schoolId: school.id,
    userId: user.id,
    federalStateId: federalState.id,
  });
  const assistants = _assistants.filter((a) => a.name !== '');

  const enrichedCustomGpts = await enrichAssistantsWithImage({ assistants });

  return (
    <Page2
      userAndContext={userAndContext}
      customGpts={enrichedCustomGpts}
      accessLevel={accessLevel}
    />
  );
}
