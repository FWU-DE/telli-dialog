import { redirect } from 'next/navigation';
import { ROUTES } from '../../../../../../../consts/routes';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;

  // Redirect to project details page where API keys are now displayed
  redirect(ROUTES.api.projectDetails(organizationId, projectId));
}
