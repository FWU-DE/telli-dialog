import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createInsertSchema } from 'drizzle-zod';
import {
  dbCreateCharacter,
  dbDeleteCharacterByIdAndUserId,
  dbGetGlobalCharacterByName,
  dbGetGlobalCharacters,
} from '@shared/db/functions/character';
import { CharacterInsertModel, characterTable } from '@shared/db/schema';
import { dbGetModelByName } from '@shared/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { DUMMY_USER_ID } from '@shared/db/seed/user-entity';
import { validateApiKeyByHeadersWithResult } from '@/utils/validation';

// Generate Zod schema from Drizzle table definition
const baseCharacterInsertSchema = createInsertSchema(characterTable);

// Customize the schema for API validation
const characterTemplateSchema = baseCharacterInsertSchema.omit({
  id: true,
  modelId: true,
  createdAt: true,
  userId: true,
});

const characterTemplateArraySchema = z.array(characterTemplateSchema);

export async function GET(request: NextRequest) {
  try {
    const [error] = validateApiKeyByHeadersWithResult(request.headers);
    if (error !== null) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const characters = await dbGetGlobalCharacters({
      userId: DUMMY_USER_ID,
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error('Error fetching template characters:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch template characters',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const [error] = validateApiKeyByHeadersWithResult(request.headers);
    if (error !== null) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const body = await request.json();
    const characterId = body['characterId'];

    if (!characterId) {
      return NextResponse.json({ error: 'characterId is required' }, { status: 400 });
    }

    const characters = await dbDeleteCharacterByIdAndUserId({
      characterId: characterId,
      userId: DUMMY_USER_ID,
    });

    return NextResponse.json(characters);
  } catch {
    return NextResponse.json(
      {
        error: 'Failed to delete template characters',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const [error] = validateApiKeyByHeadersWithResult(request.headers);
    if (error !== null) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const body = await request.json();

    // Validate the request body using Zod
    const parseResult = characterTemplateArraySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        },
        { status: 400 },
      );
    }

    const validatedCharacters = parseResult.data;

    // Get default model ID
    const defaultModel = await dbGetModelByName(DEFAULT_CHAT_MODEL);
    if (!defaultModel) {
      return NextResponse.json(
        {
          error: 'Default model not found',
        },
        { status: 500 },
      );
    }

    const results = [];

    for (const characterData of validatedCharacters) {
      try {
        // Check if a global character with this name already exists
        const existingGlobalCharacter = await dbGetGlobalCharacterByName({
          name: characterData.name.trim(),
        });

        const character: Omit<CharacterInsertModel, 'modelId'> = {
          id: existingGlobalCharacter?.id ?? undefined,
          ...characterData,
          accessLevel: 'global',
          userId: DUMMY_USER_ID,
        };

        const createdCharacter = await dbCreateCharacter(character, DEFAULT_CHAT_MODEL);

        results.push({
          data: createdCharacter?.[0],
        });
      } catch (error) {
        console.error('Error creating character:', error);
        results.push({
          error: error instanceof Error ? error.message : 'Unknown error',
          data: characterData,
        });
      }
    }

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error('Error processing character templates:', error);
    return NextResponse.json(
      {
        error: 'Failed to process character templates',
      },
      { status: 500 },
    );
  }
}
