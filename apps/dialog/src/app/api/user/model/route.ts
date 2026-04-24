import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/auth/requireAuth';
import { dbUpdateLastUsedModelByUserId } from '@shared/db/functions/user';
import { updateSession } from '@/auth/utils';
import { z } from 'zod';
import { handleErrorInRoute } from '@/error/handle-error-in-route';

const requestSchema = z.object({
  modelName: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const requestBody = await request.json();
    const { modelName } = requestSchema.parse(requestBody);

    const updatedUser = await dbUpdateLastUsedModelByUserId({ userId: user.id, modelName });
    await updateSession({
      user:
        updatedUser === undefined
          ? undefined
          : {
              id: updatedUser.id,
              lastUsedModel: updatedUser.lastUsedModel,
              versionAcceptedConditions: updatedUser.versionAcceptedConditions,
              createdAt: updatedUser.createdAt,
              userRole: updatedUser.userRole,
              schoolIds: updatedUser.schoolIds,
              federalStateId: updatedUser.federalStateId ?? undefined,
            },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
