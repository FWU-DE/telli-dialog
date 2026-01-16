import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { createNewCharacter, getCharacters } from '@shared/characters/character-service';
import { characterInsertSchema } from '@shared/db/schema';
import { NextRequest } from 'next/server';

// GET /api/v1/characters
export async function GET() {
  try {
    const { user, school } = await requireAuth();

    const characters = await getCharacters({
      schoolId: school.id,
      userId: user.id,
    });

    return Response.json(characters);
  } catch (error) {
    return handleErrorInRoute(error);
  }
}

// POST /api/v1/characters
const createNewCharacterSchema = characterInsertSchema.omit({
  userId: true,
  schoolId: true,
  isDeleted: true,
});

export async function POST(request: NextRequest) {
  try {
    const { user, school } = await requireAuth();
    const requestBody = await request.json();

    createNewCharacterSchema.parse(requestBody);

    const character = await createNewCharacter({
      ...requestBody,
      schoolId: school.id,
      userId: user.id,
    });

    return Response.json(character);
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
