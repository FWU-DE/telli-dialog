import { CharacterInsertModel, CustomGptInsertModel } from '../schema';
import * as fs from 'fs';
import * as path from 'path';
import { uploadFileToS3 } from '@/s3';
import { dbCreateCharacter } from '../functions/character';
import { DUMMY_USER_ID } from './user-entity';
import { dbUpsertCustomGpt } from '../functions/custom-gpts';

export async function insertTemplateCharacters() {
  await processStaticJpegFiles('./assets/template-characters', 'characters/_templates');
  for (const templateCharacter of defaultCharacters) {
    await dbCreateCharacter(templateCharacter);
  }
}

export async function insertTemplateCustomGpt() {
  await processStaticJpegFiles('./assets/template-custom-gpt', 'custom-gpts/_templates');
  for (const templateCustomGpt of defaultCustomGpt) {
    await dbUpsertCustomGpt({ customGpt: templateCustomGpt });
  }
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

    console.log(`Found ${matchingFiles.length} matching files:`);
    matchingFiles.forEach((file) => console.log(` - ${file}`));

    // Upload each file to S3
    console.log('\nStarting uploads...');
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
    console.log('\nAll uploads completed successfully!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

/**
 * One example value for characters and customGpt for local development and e2e tests
 */
export const defaultCharacters: Omit<CharacterInsertModel, 'modelId'>[] = [
  {
    userId: DUMMY_USER_ID,
    id: '9ef32a4e-762e-4cce-82c0-6f8ebc633de2',
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
    intelligencePointsLimit: null,
    inviteCode: null,
    maxUsageTimeLimit: null,
    pictureId: 'characters/_templates/Goethe_Static',
    subject: '',
  },
];

export const defaultCustomGpt: CustomGptInsertModel[] = [
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
