import { permanentRedirect } from 'next/navigation';
import { requireAuth } from '@/auth/requireAuth';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/custom/d/[gptId]/[conversationId]'>) {
  const params = await props.params;
  await props.searchParams;
  await requireAuth();
  permanentRedirect(`/assistants/d/${params.gptId}/${params.conversationId}`);
}
