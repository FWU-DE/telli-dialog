import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { validateApiKeyByHeaders } from '@/utils/validation';
import { getCharacters } from '@shared/characters/character-service';
import { dbCreateCharacter } from '@shared/db/functions/character';
import { characterInsertSchema, characterSelectSchema } from '@shared/db/schema';
import { NextRequest } from 'next/server';
import { string } from 'zod';

// GET /api/v1/characters
const getCharactersSchema = characterSelectSchema
  .pick({
    userId: true,
    schoolId: true,
  })
  .extend({ schoolId: string() });

export async function GET(request: NextRequest) {
  try {
    validateApiKeyByHeaders(request.headers);

    const searchParams = request.nextUrl.searchParams;
    const { userId, schoolId } = getCharactersSchema.parse(searchParams);

    const characters = await getCharacters({
      schoolId,
      userId,
    });

    return Response.json(characters);
  } catch (error) {
    return handleErrorInRoute(error);
  }
}

// POST /api/v1/characters
const createNewCharacterSchema = characterInsertSchema;

export async function POST(request: NextRequest) {
  try {
    validateApiKeyByHeaders(request.headers);

    const requestBody = await request.json();
    const characterData = createNewCharacterSchema.parse(requestBody);

    const character = dbCreateCharacter(characterData);

    return Response.json(character);
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
