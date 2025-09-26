import { dbGetFederalStateById } from '@/db/functions/federal-state';
import { validateApiKeyByHeadersWithResult } from '@/db/utils';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const { id } = await params;
  const federalState = await dbGetFederalStateById(id);

  if (federalState === undefined) {
    return NextResponse.json(
      { error: `Federal state with id ${id} does not exist` },
      { status: 404 },
    );
  }

  return NextResponse.json(federalState, { status: 200 });
}
