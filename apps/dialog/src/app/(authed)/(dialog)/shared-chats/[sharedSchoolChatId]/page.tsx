import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import HeaderPortal from '../../header-portal';
import SharedSchoolChatForm from './shared-school-chat-form';
import ProfileMenu from '@/components/navigation/profile-menu';
import { webScraperExecutable } from '@/app/api/conversation/tools/websearch/search-web';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { requireAuth } from '@/auth/requireAuth';
import {
  getFilesForLearningScenario,
  getLearningScenario,
} from '@shared/learning-scenarios/learning-scenario-service';
import { buildLegacyUserAndContext } from '@/auth/types';

export const dynamic = 'force-dynamic';

const PREFETCH_ENABLED = false;

const searchParamsSchema = z.object({ create: z.string().optional().default('false') });

export default async function Page(props: PageProps<'/shared-chats/[sharedSchoolChatId]'>) {
  const { sharedSchoolChatId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const isCreating = searchParams.create === 'true';
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const [learningScenario, relatedFiles] = await Promise.all([
    getLearningScenario({
      learningScenarioId: sharedSchoolChatId,
      userId: user.id,
    }),
    getFilesForLearningScenario({
      learningScenarioId: sharedSchoolChatId,
      userId: user.id,
    }),
  ]);

  const maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({
    key: learningScenario.pictureId ? `shared-chats/${learningScenario.id}/avatar` : undefined,
  });

  const initialLinks = PREFETCH_ENABLED
    ? await Promise.all(
        learningScenario.attachedLinks
          .filter((l) => l !== '')
          .map((url) => webScraperExecutable(url)),
      )
    : learningScenario.attachedLinks
        .filter((l) => l && l !== '')
        .map(
          (url) =>
            ({
              link: url,
              type: 'websearch',
              error: false,
            }) as WebsearchSource,
        );

  return (
    <div className="w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...userAndContext} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <SharedSchoolChatForm
          {...learningScenario}
          existingFiles={relatedFiles}
          isCreating={isCreating}
          initialLinks={initialLinks}
          maybeSignedPictureUrl={maybeSignedPictureUrl}
          readOnly={false}
        />
      </div>
    </div>
  );
}
