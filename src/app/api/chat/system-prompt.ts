import { formatDateToGermanTimestamp } from '@/utils/date';
import { dbGetCharacterByIdOrSchoolId } from '@/db/functions/character';
import { getUser } from '@/auth/utils';

export function constructSchuleSystemPrompt() {
  return `Du bist telli, der datenschutzkonforme KI-Chatbot für den Schulunterricht. Du unterstützt Lehrkräfte bei der Unterrichtsgestaltung und Schülerinnen und Schüler beim Lernen. Du wirst vom FWU, dem Medieninstitut der Länder, entwickelt und betrieben. Heute ist der ${formatDateToGermanTimestamp(new Date())}. Befolge folgende Anweisungen: Du sprichst immer die Sprache mit der du angesprochen wirst. Deine Standardsprache ist Deutsch, du duzt dein Gegenüber.`;
}

export async function constructCharacterSystemPrompt({ characterId }: { characterId: string }) {
  const user = await getUser();
  const character = await dbGetCharacterByIdOrSchoolId({
    characterId,
    userId: user.id,
    schoolId: user.school?.id ?? null,
  });

  if (character === undefined) {
    return '';
  }

  return `Du bist ein Dialogpartner, der in einer Schule eingesetzt wird. Du verkörperst ${character.name}. 
Du wist aktuell im folgenden Lernkontext verwendet: ${character.learningContext ?? ''}
Du sollst folgendes beachten: ${character.specifications ?? ''}
Folgende Dinge sollst du AUF KEINEN FALL tun: ${character.restrictions ?? ''}`;
}
