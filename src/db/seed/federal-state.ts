import { env } from '@/env';
import { db } from '..';
import { encrypt } from '../crypto';
import { FederalStateInsertModel, federalStateTable } from '../schema';
import { fetchLlmModels } from '@/knotenpunkt';
import { dbGetApiKeyByFederalStateId } from '../functions/federal-state';
import { dbUpsertLlmModelsByModelsAndFederalStateId } from '../functions/llm-model';

export async function insertFederalStates({ skip = true }: { skip: boolean }) {
  if (skip) return;
  for (const federalState of FEDERAL_STATES) {
    await db
      .insert(federalStateTable)
      .values({ ...federalState })
      .onConflictDoNothing();

    // upsert models per federal state
    const federalStateAndApiKey = await dbGetApiKeyByFederalStateId({
      federalStateId: federalState.id,
    });
    if (federalStateAndApiKey === undefined) {
      return;
    }
    const models = await fetchLlmModels({ apiKey: federalStateAndApiKey.decryptedApiKey });

    await dbUpsertLlmModelsByModelsAndFederalStateId({
      models,
      federalStateId: federalStateAndApiKey.id,
    });
  }
  console.info('Inserted federal states');
}

export const FEDERAL_STATES = [
  // {
  //   id: 'DE-BW',
  //   name: 'Baden-Württemberg',
  // },
  {
    id: 'DE-BY',
    // name: 'Bayern (Freistaat)',
    studentPriceLimit: 200,
    teacherPriceLimit: 500,
    encryptedApiKey: encrypt({
      plainEncryptionKey: env.encryptionKey,
      text: process.env.BAVARIA_API_KEY!,
    }),
  },
  // {
  //   id: 'DE-BE',
  //   name: 'Berlin',
  // },
  // {
  //   id: 'DE-BB',
  //   name: 'Brandenburg',
  // },
  // {
  //   id: 'DE-HB',
  //   name: 'Bremen (Hansestadt)',
  // },
  // {
  //   id: 'DE-HH',
  //   name: 'Hamburg (Hansestadt)',
  // },
  // {
  //   id: 'DE-HE',
  //   name: 'Hessen',
  // },
  // {
  //   id: 'DE-MV',
  //   name: 'Mecklenburg-Vorpommern',
  // },
  // {
  //   id: 'DE-NI',
  //   name: 'Niedersachsen',
  // },
  // {
  //   id: 'DE-NW',
  //   name: 'Nordrhein-Westfalen',
  // },
  // {
  //   id: 'DE-RP',
  //   name: 'Rheinland-Pfalz',
  // },
  // {
  //   id: 'DE-SL',
  //   name: 'Saarland',
  // },
  // {
  //   id: 'DE-SN',
  //   name: 'Sachsen (Freistaat)',
  // },
  // {
  //   id: 'DE-ST',
  //   name: 'Sachsen-Anhalt',
  // },
  // {
  //   id: 'DE-SH',
  //   name: 'Schleswig-Holstein',
  // },
  // {
  //   id: 'DE-TH',
  //   name: 'Thüringen (Freistaat)',
  // },
  // {
  //   id: 'DE-TEST',
  //   name: 'Testbundesland',
  // },
] satisfies Array<Omit<FederalStateInsertModel, 'organizationId'>>;
