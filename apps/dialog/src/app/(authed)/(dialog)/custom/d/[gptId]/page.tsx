import { permanentRedirect } from 'next/navigation';
import { requireAuth } from '@/auth/requireAuth';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/custom/d/[gptId]'>) {
  const { gptId } = await props.params;
  await requireAuth();
  permanentRedirect(`/assistants/d/${gptId}`);
}
