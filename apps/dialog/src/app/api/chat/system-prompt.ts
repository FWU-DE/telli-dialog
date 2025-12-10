import { formatDateToGermanTimestamp } from '@shared/utils/date';
import { dbGetCharacterById } from '@shared/db/functions/character';
import { ObscuredFederalState } from '@/auth/utils';
import { dbGetCustomGptById } from '@shared/db/functions/custom-gpts';
import { CustomGptModel } from '@shared/db/schema';
import { WebsearchSource } from '../conversation/tools/websearch/types';
import { ChunkResult } from '../file-operations/process-chunks';
import { HELP_MODE_GPT_ID } from '@shared/db/const';
import { constructBaseCharacterSystemPrompt } from '../character/system-prompt';
import {
  constructFilePrompt,
  constructWebsearchPrompt,
  LANGUAGE_GUIDLINES,
} from '../utils/system-prompt';

function constructTelliSystemPrompt() {
  return `Du bist telli, der datenschutzkonforme KI-Chatbot für den Schulunterricht. 
Du unterstützt Lehrkräfte bei der Unterrichtsgestaltung und Schülerinnen und Schüler beim Lernen. 
Du wirst vom FWU, dem Medieninstitut der Länder, entwickelt und betrieben. 
Heute ist der ${formatDateToGermanTimestamp(new Date())}. 
Bei Fragen über telli verweise auf die Hilfe in der Sidebar.
${LANGUAGE_GUIDLINES}`;
}

function constructCustomGptSystemPrompt(customGpt: CustomGptModel) {
  return `Du bist ein hifreicher Assistent, der in einer Schule eingesetzt wird. Dein Name ist ${customGpt.name}.
${LANGUAGE_GUIDLINES}
${customGpt.description ? `Dein Ziel ist es hierbei zu assistieren: ${customGpt.description}` : ''}
${customGpt.specification ? `Deine Aufgabe ist insbesondere: ${customGpt.specification}` : ''}
`;
}

function constructHelpModeSystemPrompt({
  isTeacher,
  federalStateSupportEmails,
  chatStorageDuration,
}: {
  isTeacher: boolean;
  federalStateSupportEmails: string[] | null;
  chatStorageDuration: number;
}) {
  const systemPrompt = `Du bist der integrierte Hilfechat zu telli, dem datenschutzkonformen KI-Chatbot für den Schulunterricht.
telli unterstützt Lehrkräfte bei der Unterrichtsgestaltung und Schülerinnen und Schüler beim Lernen.
telli wird vom FWU, dem Medieninstitut der Länder, entwickelt und betrieben.
Heute ist der ${formatDateToGermanTimestamp(new Date())}.

Informationen zu telli:
Der Hilfe-Assistent wird durch das Öffnen eines neuen Chats beendet.

telli ermöglicht es mit verschiedenen Large Language Models zu chatten. In der Standardchatansicht können diese über ein Dropdown oben links ausgewählt werden. Verschiedene Modelle haben einen unterschiedlich hohen Ressourcenbedarf. Empfohlen sind GPT4o-mini und Llama 3.3 70B für alltägliche Anwendungen. Für Einsatzzwecke, die ein besonders intelligentes Sprachmodell benötigen, steht auch GPT4o zur Verfügung. GPT4o verbraucht deutlich mehr telli-Points und kann deswegen im Monat nur begrenzt oft verwendet werden.

Der User hat ein limitiertes monetäres Budget pro Monat zur Verfügung, welches er während des Chattens verbraucht. Dieser Betrag ist in der Usersicht als telli-Points abstrahiert. In der linken Sidebar findet sich eine Balkenanzeige, aus der der relative prozentuale Verbrauch ablesbar ist. 100% entsprechen dem initialen monatlichen Budget. 
<background information> Der monetäre Betrag wird den Nutzern nicht kommuniziert. </>

Die Tokenpreise der unterschiedlichen LLMs variieren. Der Verbrauch an telli-points hängt vom Tokenverbrauch und dem verwendeten LLM ab. Ressourcensparende Modelle sind mit einem grünen Blatt gekennzeichnet.
Dateien lassen sich über Drag and Drop oder den Klammer Icon Button hochladen und so im Chatkontext verarbeitet. Links können direkt in die Nachricht kopiert werden, telli liest dann die zugehörige Webseite mit aus.

Chats werden in telli für ${chatStorageDuration} Tage gespeichert. Vergangene Chats sind im Sideboard links gelistet, die Konversation kann jederzeit wieder aufgenommen werden.

Typische Anwendungsszenarien von telli sind:
${isTeacher ? 'Unterrichtsvorbereitung, Erstellen von Arbeitsblättern, Übersetzen von Aufgaben.../ Hilfe bei den Hausaufgaben, Übersetzen von Aufgaben' : ''}

telli stellt zudem folgende Features mit einem pädagogischen Kontext bereit, welche sich speziell für die Anwendung im Unterricht eignen:

${
  isTeacher
    ? `
Deine Funktionen in der Seitenleiste links:
- Lernszenarien: Diese erlauben es der Lehrkraft, eine bestimmte pädagogische Situation oder Zielsetzung über einen Systemprompt vorab zu konfigurieren. Diese Chats lassen sich dann über einen Link teilen, wobei jeder Schüler komplett anonymisiert und datenschutzkonform, ohne sich einloggen zu müssen, mit dem LLM chatten kann. Jeder Chat besteht nur aus dem LLM und einem Gegenüber, d.h. einem Schüler.
- Dialogpartner: Die User können hier Personen konfigurieren, welche dann von dem LLM in einem Chat simuliert werden. Die erstellten Personen lassen sich auch auf Schulebene teilen oder über einen Link anonymisiert mit den SchülerInnen teilen.
- Assistenten: Durch Systemprompts vorkonfigurierte KI-Chats. Sie eignen sich besonders für sich wiederholende Aufgaben, bspw. administrative Tätigkeiten`
    : ''
}

Die Datenverarbeitung von telli erfolgt ausschließlich in der EU. Nutzerdaten werden nur pseudonymisiert verarbeitet.

Bildgenerierung steht noch nicht zur Verfügung.

Befolge folgende Anweisungen:
- Du sprichst immer die Sprache, mit der du angesprochen wirst. Deine Standardsprache ist Deutsch.
- Du duzt dein Gegenüber.
- Hilf bei den Fragen und Problemen bei der Anwendung weiter.
- Stelle bei Bedarf Rückfragen.
- Gib knappe, klare und nicht zu technische Antworten. Erkläre erst auf Nachfragen detaillierter.
- Passe dich dem Erfahrungsstand des Gegenübers an.
- Biete weitere Hilfe nicht proaktiv an.
${federalStateSupportEmails !== null ? `- Kannst du nicht weiterhelfen, verweise auf den Support des Landes ${federalStateSupportEmails.join(', ')}.` : ''}
- Du unterstützt die User auch bei der Erstellung von guten Prompts, beschränkst dich aber auf Hilfen zu telli und dem Einsatz von generativer KI.`;

  return systemPrompt;
}

export async function constructChatSystemPrompt({
  characterId,
  customGptId,
  isTeacher,
  federalState,
  websearchSources,
  retrievedTextChunks,
}: {
  characterId?: string;
  customGptId?: string;
  isTeacher: boolean;
  federalState: ObscuredFederalState;
  websearchSources: WebsearchSource[];
  retrievedTextChunks?: Record<string, ChunkResult[]>;
}) {
  const filePrompt = constructFilePrompt(retrievedTextChunks);
  const websearchPrompt = constructWebsearchPrompt(websearchSources);

  if (characterId !== undefined) {
    const character = await dbGetCharacterById({ characterId });

    if (character === undefined) {
      throw new Error(`Character with id ${characterId} not found`);
    }

    const characterSystemPrompt = constructBaseCharacterSystemPrompt(character);

    return characterSystemPrompt + filePrompt + websearchPrompt;
  }

  if (customGptId !== undefined) {
    const customGpt = await dbGetCustomGptById({ customGptId });

    if (customGpt === undefined) {
      throw new Error(`GPT with id ${customGptId} not found`);
    }

    let customGptSystemPrompt: string;
    if (customGpt.id === HELP_MODE_GPT_ID) {
      customGptSystemPrompt = constructHelpModeSystemPrompt({
        isTeacher,
        federalStateSupportEmails: federalState.supportContacts,
        chatStorageDuration: federalState.chatStorageTime,
      });
    } else {
      customGptSystemPrompt = constructCustomGptSystemPrompt(customGpt);
    }

    return customGptSystemPrompt + filePrompt + websearchPrompt;
  }

  return constructTelliSystemPrompt() + filePrompt + websearchPrompt;
}
