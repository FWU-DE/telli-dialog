import { accessLevelSchema, overviewFilterSchema } from '@shared/db/schema';
import Page2 from './_page';
import { enrichGptWithImage } from './utils';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import {
  getCustomGptByAccessLevel,
  getCustomGptsByOverviewFilter,
} from '@shared/custom-gpt/custom-gpt-service';
import { getFederalStateById } from '@shared/federal-states/federal-state-service';
import CustomGptOverview from './custom-gpt-overview';
import { HELP_MODE_GPT_ID } from '@shared/db/const';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  visibility: accessLevelSchema.optional().default('private'),
  filter: overviewFilterSchema.optional().default('all'),
});

export default async function Page(props: PageProps<'/custom'>) {
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const { user, school, federalState } = await requireAuth();
  const fullFederalState = await getFederalStateById(federalState.id);
  const isNewUi = fullFederalState.featureToggles.isNewUiDesignEnabled;

  if (isNewUi) {
    const filter = searchParams.filter;
    const _customGpts = await getCustomGptsByOverviewFilter({
      filter,
      schoolId: school.id,
      userId: user.id,
      federalStateId: federalState.id,
    });
    const customGpts = _customGpts.filter((c) => c.name !== '' && c.id !== HELP_MODE_GPT_ID);
    const enrichedCustomGpts = await enrichGptWithImage({ customGpts });

    return (
      <CustomGptOverview
        customGpts={enrichedCustomGpts}
        activeFilter={filter}
        currentUserId={user.id}
      />
    );
  }

  const accessLevel = searchParams.visibility;
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const _customGpts = await getCustomGptByAccessLevel({
    accessLevel,
    schoolId: school.id,
    userId: user.id,
    federalStateId: federalState.id,
  });
  const customGpts = _customGpts.filter((c) => c.name !== '');
  const enrichedCustomGpts = await enrichGptWithImage({ customGpts });

  return (
    <Page2
      userAndContext={userAndContext}
      customGpts={enrichedCustomGpts}
      accessLevel={accessLevel}
    />
  );
}
