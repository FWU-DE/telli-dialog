import { requireAuth } from '@/auth/requireAuth';
import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { updateCustomGpt } from '@shared/custom-gpt/custom-gpt-service';
import { NextRequest } from 'next/server';
import z from 'zod';

const autosaveSchema = z.object({
  name: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  description: z.string().max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
});

/* Endpoint for autosaving assistant data.
 * Server actions cannot be used for this, because if the user leaves or closes the page,
 * server actions are not guaranteed to complete, while this endpoint can be called with
 * a fetch request with keepalive option, which allows the request to complete even if the page is closed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> },
) {
  try {
    const { user } = await requireAuth();
    const { assistantId } = await params;
    const body = autosaveSchema.parse(await request.json());

    await updateCustomGpt({
      customGptId: assistantId,
      userId: user.id,
      customGptProps: {
        name: body.name,
        description: body.description,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
