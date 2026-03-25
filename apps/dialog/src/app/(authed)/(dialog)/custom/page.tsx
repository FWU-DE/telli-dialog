import { accessLevelSchema } from '@shared/db/schema';
import { overviewFilterSchema } from '@shared/overview-filter';
import Page2 from './_page';
import { enrichAssistantsWithImage } from './utils';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { getAssistantByAccessLevel, getAssistantsByOverviewFilter } from '@shared/assistants/assistant-service';
import { getFederalStateById } from '@shared/federal-states/federal-state-service';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
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
  const isNewUi = federalState.featureToggles.isNewUiDesignEnabled;

  if (isNewUi) {
    const isSchoolSharingEnabled = federalState.featureToggles.isShareTemplateWithSchoolEnabled;
    const filter =
      !isSchoolSharingEnabled && searchParams.filter === 'school' ? 'all' : searchParams.filter;
    const _customGpts = await getCustomGptsByOverviewFilter({
      filter,
      schoolId: school.id,
      userId: user.id,
      federalStateId: federalState.id,
    }).catch(handleErrorInServerComponent);
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
