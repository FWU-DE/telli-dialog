import { dbGetAllFederalStates } from '@/db/functions/federal-state';
import { dbUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';
import { validateApiKeyByHeadersWithResult } from '@/db/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(req.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const states = await dbGetAllFederalStates();

  const models: Record<string, Awaited<ReturnType<typeof dbUpdateLlmModelsByFederalStateId>>> = {};
  for (const state of states) {
    models[state.id] = await dbUpdateLlmModelsByFederalStateId({ federalStateId: state.id });
  }

  return NextResponse.json(models, { status: 200 });
}
