import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { validateApiKeyByHeaders } from '@/utils/validation';
import { deleteCharacter, shareCharacter } from '@shared/characters/character-service';
import { NextRequest } from 'next/server';
import z from 'zod';

// PATCH /api/v1/characters/[characterId]
export const patchCharacterSchema = z.object({
  shareCharacter: z.object({
    userId: z.string(),
    telliPointsPercentageLimit: z.number(),
    usageTimeLimitMinutes: z.number(),
  }),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> },
) {
  try {
    validateApiKeyByHeaders(request.headers);

    const { characterId } = await params;
    const requestBody = await request.json();

    const patchCharacterValues = patchCharacterSchema.parse(requestBody);
    const { telliPointsPercentageLimit, usageTimeLimitMinutes, userId } =
      patchCharacterValues.shareCharacter;

    const shareData = shareCharacter({
      characterId,
      user: { id: userId, userRole: 'teacher' },
      telliPointsPercentageLimit,
      usageTimeLimitMinutes,
    });

    return Response.json(shareData);
  } catch (error) {
    return handleErrorInRoute(error);
  }
}

// DELETE /api/v1/characters/[characterId]
const deleteCharacterSchema = z.object({
  userId: z.string(),
});
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> },
) {
  try {
    validateApiKeyByHeaders(request.headers);
    const { characterId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const { userId } = deleteCharacterSchema.parse(searchParams);

    await deleteCharacter({ characterId, userId });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
