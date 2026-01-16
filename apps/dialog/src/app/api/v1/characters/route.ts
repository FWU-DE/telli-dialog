import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { getCharacters } from '@shared/characters/character-service';

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
