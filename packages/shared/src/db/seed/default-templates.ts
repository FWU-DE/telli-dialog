import {
  CharacterInsertModel,
  CustomGptInsertModel,
  LearningScenarioInsertModel,
  learningScenarioTable,
} from '../schema';
import * as fs from 'fs';
import * as path from 'path';
import { uploadFileToS3 } from '../../s3';
import { dbCreateCharacter } from '../functions/character';
import { DUMMY_USER_ID } from './user-entity';
import { dbUpsertCustomGpt } from '../functions/custom-gpts';
import { updateTemplateMappings } from '@shared/templates/template-service';
import { FEDERAL_STATES } from './federal-state';
import { dbGetModelByName } from '@shared/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import { db } from '@shared/db';

export async function insertTemplateCharacters() {
  await processStaticJpegFiles(
    `${import.meta.dirname}/assets/template-characters`,
    'characters/_templates',
  );
  for (const templateCharacter of defaultTemplates) {
    const result = await dbCreateCharacter(templateCharacter);
    const id = result && result[0] ? result[0].id : undefined;
    if (!id) {
      console.log('Failed to seed template character', {
        characterName: templateCharacter.name,
      });
      continue;
    }
    await updateTemplateMappings(
      'character',
      id,
      FEDERAL_STATES.map((fs) => ({ federalStateId: fs.id, isMapped: true })),
    );
  }
  console.log('template character seed successful');
}

export async function insertTemplateCustomGpt() {
  await processStaticJpegFiles(
    `${import.meta.dirname}/assets/template-custom-gpt`,
    'custom-gpts/_templates',
  );
  for (const templateCustomGpt of defaultCustomGpt) {
    const result = await dbUpsertCustomGpt({ customGpt: templateCustomGpt });
    const id = result?.id ?? undefined;
    if (!id) {
      console.log('Failed to seed template custom gpt', {
        customGptName: templateCustomGpt.name,
      });
      continue;
    }
    await updateTemplateMappings(
      'custom-gpt',
      id,
      FEDERAL_STATES.map((fs) => ({ federalStateId: fs.id, isMapped: true })),
    );
  }
  console.log('template custom gpt seed successful');
}

export async function insertTemplateLearningScenarios() {
  await processStaticJpegFiles(
    `${import.meta.dirname}/assets/template-learning-scenarios`,
    'shared-chats/_templates',
  );

  const modelId = (await dbGetModelByName(DEFAULT_CHAT_MODEL))?.id;
  if (!modelId) {
    throw new Error('No default model found');
  }

  for (const templateLearningScenario of defaultLearningScenario) {
    const [newLearningScenario] = await db
      .insert(learningScenarioTable)
      .values({ ...templateLearningScenario, modelId })
      .onConflictDoUpdate({
        target: learningScenarioTable.id,
        set: { ...templateLearningScenario, modelId },
      })
      .returning();

    if (!newLearningScenario) {
      console.log('Failed to seed template learning scenario', {
        learningScenarioName: templateLearningScenario.name,
      });
      continue;
    }
    await updateTemplateMappings(
      'learning-scenario',
      newLearningScenario.id,
      FEDERAL_STATES.map((fs) => ({ federalStateId: fs.id, isMapped: true })),
    );
  }
  console.log('template learning scenario seed successful');
}

async function findMatchingFiles(directoryPath: string, pattern: string): Promise<string[]> {
  const matchingFiles: string[] = [];

  // Read all items in the directory
  const items = await fs.promises.readdir(directoryPath);

  for (const item of items) {
    const itemPath = path.join(directoryPath, item);
    const stats = await fs.promises.stat(itemPath);

    if (stats.isDirectory()) {
      // Recursively scan subdirectories
      const filesInSubdir = await findMatchingFiles(itemPath, pattern);
      matchingFiles.push(...filesInSubdir);
    } else if (stats.isFile() && item.endsWith(pattern)) {
      // Add file path if it matches the pattern
      matchingFiles.push(itemPath);
    }
  }

  return matchingFiles;
}

/**
 * Main function to process files ending with 'Static.jpeg'
 * @param rootFolder - The root folder to start scanning from
 */
async function processStaticJpegFiles(rootFolder: string, rootRemoteDir: string): Promise<void> {
  try {
    // Find all matching files
    const matchingFiles = await findMatchingFiles(rootFolder, 'Static.jpg');

    if (matchingFiles.length === 0) {
      console.log('No matching files found.');
      return;
    }

    console.log(
      `Starting upload of ${matchingFiles.length} matching files: ${matchingFiles.join()}`,
    );

    // Upload each file to S3
    for (const file of matchingFiles) {
      const fileNameWithSuffix = file.split('/').at(-1) ?? '';
      const fileName = fileNameWithSuffix.split('.')[0];
      const fileBuffer = fs.readFileSync(file);
      await uploadFileToS3({
        key: `${rootRemoteDir}/${fileName}`,
        body: fileBuffer,
        contentType: 'image/jpeg',
      });
    }
    console.log('All uploads completed successfully!');
  } catch (error) {
    console.log('An error occurred during file upload', error);
  }
}

/**
 * One example value for characters, learning scenarios, and customGpt for local development and e2e tests
 */
export const defaultTemplates: Omit<CharacterInsertModel, 'modelId'>[] = [
  {
    userId: DUMMY_USER_ID,
    name: 'Johann Wolfgang von Goethe',
    description: 'Dichter der Klassik und des Sturm und Drang, Verfasser des "Faust" ',
    competence: 'Die Schüler lesen den Faust und versuchen Bezüge zu unserer Zeit herzustellen.',
    learningContext:
      'Zeitlosigkeit des Werkes begreifen Inhalte des "Faust" verstehen Zeitgeist der Klassik verstehen Goethes Gedanken nachvollziehen können',
    specifications:
      'Einfache, relativ kurze Antworten geben. In jeder Antwort soll auf Inhalte des Faust hingewiesen werden. Der Dialogpartner soll immer wieder versuchen, den Schüler in ein Gespräch über Inhalte des Faust zu verwickeln. Bei Nachfragen soll mit Zitaten aus dem Werk geantwortet werden und es soll erklärt werden, welchen Bezug zur Lebenswelt der Schüler man herstellen kann.',
    restrictions: 'Er soll nicht vom Thema abweichen.',

    gradeLevel: '',
    schoolId: null,
    accessLevel: 'global',
    schoolType: '',
    pictureId: 'characters/_templates/Goethe_Static',
    subject: '',
  },
];

export type CustomGptInsertModelWithId = CustomGptInsertModel & { id: string };
export const defaultCustomGpt: CustomGptInsertModelWithId[] = [
  {
    id: 'edb34bca-9868-4948-af68-7e80810806ac',
    userId: DUMMY_USER_ID,
    name: 'Schulorganisationsassistent',
    description: 'Planer für organisatorische Aufgaben innerhalb der Schule',
    specification:
      'Der Assistent soll mich in meiner täglichen organisatorischen Arbeit unterstützen. Er soll Vorlagen für Elternbriefe, Elternabende, Rundschreiben, Vorlagen für Protokolle für Elterngespräche, Bewertungsvorlagen für Schüler:innenarbeiten etc. generieren, die ich mir einfach anpassen kann. Das Format sollte so gewählt sein, dass ich es einfach exportieren kann, ohne große Formatänderungen vornehmen zu müssen.',
    systemPrompt: '',
    accessLevel: 'global',
    pictureId: 'custom-gpts/_templates/Schulorganisationsassistent_Static',
    promptSuggestions: [
      'Erstelle mir einen Elternbrief zu einem Wandertag.',
      'Erstelle mir eine Vorlage für ein Gesprächsprotokoll für ein Elterngespräch.',
      'Erstelle mir einen Bewertungsbogen für ein Referat in tabellarischer Form.',
      'Erstelle mir einen Elternbrief zur Einladung für den Elternsprechabend in leichter Sprache (Deutsch, Kroatisch, Arabisch, Albanisch und Englisch).',
      'Erstelle mir einen Ablauf für einen 90-minütigen Elternabend.',
    ],
  },
];

export const defaultLearningScenario: Omit<LearningScenarioInsertModel, 'modelId'>[] = [
  {
    id: 'bd84c3e7-7789-4284-9125-196d321c3715',
    userId: DUMMY_USER_ID,
    name: 'Lern was über KI',
    description: 'Die Schüler sollen lernen wie KI funktioniert',
    studentExercise: `1. Was kann KI?
2. Womit hat KI Schwächen?
3. Wo macht KI Fehler?
4. Wie kannst du beurteilen, was von KI richtig oder falsch ist?`,
    additionalInstructions:
      'Du bist eine künstliche Intelligenz. Du bringst dem Schüler bei, was du gut machst, wo deine Schwächen liegen und wo du einfach nur halluzinierst. Wenn du Fehler machst, stehe dafür ein.',
    accessLevel: 'global',
    pictureId: 'shared-chats/_templates/AI-Lernszenario_Static',

    gradeLevel: '',
    schoolId: null,
    schoolType: '',
    subject: '',
  },
];
