import { validateApiKeyByHeadersWithResult } from '@/utils/validation';
import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@shared/logging';
import { cleanupCharacters } from '@shared/characters/character-service';
import { cleanupLearningScenarios } from '@shared/learning-scenarios/learning-scenario-admin-service';
import { cleanupCustomGpts } from '@shared/custom-gpt/custom-gpt-service';

export async function DELETE(req: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(req.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  try {
    const [deletedCharacters, deletedLearningScenarios, deletedCustomGpts] = await Promise.all([
      cleanupCharacters(),
      cleanupLearningScenarios(),
      cleanupCustomGpts(),
    ]);
    const message = {
      message: 'Cleanup finished!',
      deletedCharacters,
      deletedLearningScenarios,
      deletedCustomGpts,
    };
    logInfo('Cleanup finished:', message);
    return NextResponse.json(message, { status: 200 });
  } catch (error) {
    logError('Error during cleanup', error);
    return NextResponse.json({ error: 'Error during cleanup' }, { status: 500 });
  }
}
