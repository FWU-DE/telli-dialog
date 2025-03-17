export const FEDERAL_STATE_NAMES = {
  'DE-BW': 'Baden-Württemberg',
  'DE-BY': 'Bayern (Freistaat)',
  'DE-BE': 'Berlin',
  'DE-BB': 'Brandenburg',
  'DE-HB': 'Bremen (Hansestadt)',
  'DE-HH': 'Hamburg (Hansestadt)',
  'DE-HE': 'Hessen',
  'DE-MV': 'Mecklenburg-Vorpommern',
  'DE-NI': 'Niedersachsen',
  'DE-NW': 'Nordrhein-Westfalen',
  'DE-RP': 'Rheinland-Pfalz',
  'DE-SL': 'Saarland',
  'DE-SN': 'Sachsen (Freistaat)',
  'DE-ST': 'Sachsen-Anhalt',
  'DE-SH': 'Schleswig-Holstein',
  'DE-TH': 'Thüringen (Freistaat)',
  'DE-TEST': 'Testbundesland',
} satisfies Record<string, string>;

export type FederalStateId = keyof typeof FEDERAL_STATE_NAMES;

export function getFederalStateNameById(federalStateId: string) {
  return (
    (FEDERAL_STATE_NAMES as Record<string, string>)[federalStateId] ?? 'Unbekanntes Bundesland'
  );
}
