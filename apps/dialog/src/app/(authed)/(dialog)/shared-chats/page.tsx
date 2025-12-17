import Refresh from '@/components/refresh';
import { SharedChatContainer } from './shared-chat-container';
import { getLearningScenariosForUser } from '@shared/learning-scenarios/learning-scenario-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const learningScenarios = await getLearningScenariosForUser({ userId: user.id }).catch(
    handleErrorInServerComponent,
  );

  return (
    <main className="w-full p-6">
      <Refresh />
      <SharedChatContainer learningScenarios={learningScenarios} user={userAndContext} />
    </main>
  );
}
