import { NextResponse } from 'next/server';
import { requireAuth } from '@/auth/requireAuth';
import { dbUpdateLastUsedModelByUserId } from '@shared/db/functions/user';
import { updateSession } from '@/auth/utils';

export async function POST(request: Request) {
  const { user } = await requireAuth();
  const { modelName } = (await request.json()) as { modelName: string };
  const updatedUser = await dbUpdateLastUsedModelByUserId({ userId: user.id, modelName });
  await updateSession({ user: updatedUser });
  return NextResponse.json({ ok: true });
}
