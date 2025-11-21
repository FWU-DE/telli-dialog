import { dbUpdateLlmModelsForAllFederalStates } from '@shared/db/functions/llm-model';
import { validateApiKeyByHeadersWithResult } from '@/utils/validation';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(req.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const models = await dbUpdateLlmModelsForAllFederalStates();

  return NextResponse.json(models, { status: 200 });
}
