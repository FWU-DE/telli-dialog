import { expect, Page } from '@playwright/test';

export async function deleteCharacter(page: Page, name: string) {
  const card = page.getByRole('button', { name }).first();
  await expect(card).toBeVisible();
  await card.click();
  await page.waitForURL('/characters/editor/**');
  const deleteButton = page.getByRole('button', { name: 'Dialogpartner endgültig löschen' });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
}

export async function configureCharacter(
  page: Page,
  data?: {
    name?: string;
    description?: string;
    schoolType?: string;
    gradeLevel?: string;
    subject?: string;
    competence?: string;
    learningContext?: string;
    specifications?: string;
    restrictions?: string;
  },
) {
  await page.getByLabel('Schultyp').fill(data?.schoolType ?? 'Gymnasium');
  await page.getByLabel('Klassenstufe').fill(data?.gradeLevel ?? '10. Klasse');
  await page.getByLabel('Fach').fill(data?.subject ?? 'Geschichte');

  await page.getByLabel('Wie heißt die simulierte Person? *').fill(data?.name ?? 'John Cena');

  await page
    .getByLabel('Wie kann die simulierte Person kurz beschrieben werden? *')
    .fill(
      data?.description ??
        'Er ist bekannt für seinen Spruch „You can`t see me“ und seine Wrestling-Karriere.',
    );

  await page
    .getByLabel('Welche Kompetenzen sollen die Lernenden erwerben? *')
    .fill(data?.competence ?? 'Gut wrestlen können');

  await page
    .getByLabel('Was ist die konkrete Unterrichtssituation? *')
    .fill(data?.learningContext ?? 'Ein Dialog mit John Cena über Erfolg im Leben.');

  await page
    .getByLabel('Wie soll der Dialogpartner antworten?')
    .fill(data?.specifications ?? 'John Cena soll über seine Karriere und Erfolge sprechen.');

  await page
    .getByLabel('Wie soll der Dialogpartner nicht antworten?')
    .fill(data?.restrictions ?? 'John Cena soll nicht über sein Privatleben sprechen.');
}
