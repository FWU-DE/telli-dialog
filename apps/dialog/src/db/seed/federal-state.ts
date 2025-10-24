import { env } from '@/env';
import { db } from '..';
import { encrypt } from '../crypto';
import { FederalStateInsertModel, federalStateTable } from '../schema';
import { fetchLlmModels } from '@/knotenpunkt';
import { dbGetFederalStateWithDecryptedApiKey } from '../functions/federal-state';
import { dbUpsertLlmModelsByModelsAndFederalStateId } from '../functions/llm-model';

export async function insertFederalStates({ skip = true }: { skip: boolean }) {
  if (skip) return;
  for (const federalState of FEDERAL_STATES) {
    await db
      .insert(federalStateTable)
      .values({ ...federalState })
      .onConflictDoNothing();

    // upsert models per federal state
    const federalStateAndApiKey = await dbGetFederalStateWithDecryptedApiKey({
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
}

const FEDERAL_STATE_DEFINITIONS = [
  {
    id: 'DE-BW',
    name: 'Baden-Württemberg',
    envKeyName: 'DE_BW_API_KEY',
  },
  {
    id: 'DE-BY',
    name: 'Bayern (Freistaat)',
    envKeyName: 'DE_BY_API_KEY',
  },
  {
    id: 'DE-BE',
    name: 'Berlin',
    envKeyName: 'DE_BE_API_KEY',
  },
  {
    id: 'DE-BB',
    name: 'Brandenburg',
    envKeyName: 'DE_BB_API_KEY',
  },
  {
    id: 'DE-HB',
    name: 'Bremen (Hansestadt)',
    envKeyName: 'DE_HB_API_KEY',
  },
  {
    id: 'DE-HH',
    name: 'Hamburg (Hansestadt)',
    envKeyName: 'DE_HH_API_KEY',
  },
  {
    id: 'DE-HE',
    name: 'Hessen',
    envKeyName: 'DE_HE_API_KEY',
  },
  {
    id: 'DE-MV',
    name: 'Mecklenburg-Vorpommern',
    envKeyName: 'DE_MV_API_KEY',
  },
  {
    id: 'DE-NI',
    name: 'Niedersachsen',
    envKeyName: 'DE_NI_API_KEY',
  },
  {
    id: 'DE-NW',
    name: 'Nordrhein-Westfalen',
    envKeyName: 'DE_NW_API_KEY',
  },
  {
    id: 'DE-RP',
    name: 'Rheinland-Pfalz',
    envKeyName: 'DE_RP_API_KEY',
  },
  {
    id: 'DE-SL',
    name: 'Saarland',
    envKeyName: 'DE_SL_API_KEY',
  },
  {
    id: 'DE-SN',
    name: 'Sachsen (Freistaat)',
    envKeyName: 'DE_SN_API_KEY',
  },
  {
    id: 'DE-ST',
    name: 'Sachsen-Anhalt',
    envKeyName: 'DE_ST_API_KEY',
  },
  {
    id: 'DE-SH',
    name: 'Schleswig-Holstein',
    envKeyName: 'DE_SH_API_KEY',
  },
  {
    id: 'DE-TH',
    name: 'Thüringen (Freistaat)',
    envKeyName: 'DE_TH_API_KEY',
  },
  {
    id: 'DE-TEST',
    name: 'Testbundesland',
    envKeyName: 'DE_TEST_API_KEY',
  },
  {
    id: 'DE-FWU',
    name: 'FWU',
    envKeyName: 'DE_FWU_API_KEY',
  },
];

// Generate federal states dynamically based on available API keys in environment
export const FEDERAL_STATES = FEDERAL_STATE_DEFINITIONS.filter((state) => {
  const apiKey = process.env[state.envKeyName];
  return apiKey && apiKey.trim() !== '';
}).map((state) => ({
  id: state.id,
  studentPriceLimit: 200,
  teacherPriceLimit: 500,
  encryptedApiKey: encrypt({
    plainEncryptionKey: env.encryptionKey,
    text: process.env[state.envKeyName]!,
  }),
})) satisfies Array<Omit<FederalStateInsertModel, 'organizationId'>>;
