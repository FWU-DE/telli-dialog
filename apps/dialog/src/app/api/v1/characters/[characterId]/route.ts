import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { deleteCharacter, shareCharacter } from '@shared/characters/character-service';
import { NextRequest } from 'next/server';
import z from 'zod';

// PATCH /api/v1/characters/[characterId]
export const patchCharacterSchema = z.object({
  shareCharacter: z.object({
    telliPointsPercentageLimit: z.number(),
    usageTimeLimitMinutes: z.number(),
  }),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> },
) {
  try {
    const { user } = await requireAuth();
    const { characterId } = await params;
    const requestBody = await request.json();

    const parseResult = patchCharacterSchema.parse(requestBody);
    const { telliPointsPercentageLimit, usageTimeLimitMinutes } = parseResult.shareCharacter;

    const shareData = shareCharacter({
      characterId,
      user,
      telliPointsPercentageLimit,
      usageTimeLimitMinutes,
    });

    return Response.json(shareData);
  } catch (error) {
    return handleErrorInRoute(error);
  }
}

// DELETE /api/v1/characters/[characterId]
export async function DELETE({ params }: { params: Promise<{ characterId: string }> }) {
  try {
    const { user } = await requireAuth();
    const { characterId } = await params;

    await deleteCharacter({ characterId, userId: user.id });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
