import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { db } from '@shared/db';
import { federalStateTable } from '@shared/db/schema';
import { eq } from 'drizzle-orm';
import { E2E_FEDERAL_STATE } from '../../utils/const';
import { sendMessage } from '../../utils/chat';

const featureToggleDefaults = {
  isStudentAccessEnabled: true,
  isCharacterEnabled: true,
  isCustomGptEnabled: true,
  isSharedChatEnabled: true,
  isShareTemplateWithSchoolEnabled: true,
  isImageGenerationEnabled: true,
};

async function setAnonymizationEnabled(enabled: boolean) {
  await db
    .update(federalStateTable)
    .set({ featureToggles: { ...featureToggleDefaults, isAnonymizationEnabled: enabled } })
    .where(eq(federalStateTable.id, E2E_FEDERAL_STATE));
}

test('user message with PII is anonymized when the toggle is enabled', async ({ page }) => {
  await setAnonymizationEnabled(true);

  try {
    await login(page, 'teacher');
    await sendMessage(
      page,
      'Antworte nur mit OK. Kontakt: maria.muster@schule-beispiel.de oder +49 89 1234567.',
    );

    // Anonymization happens server-side at ingress; the client renders its local copy
    // until the persisted conversation is loaded again
    await page.reload();

    const userMessage = page.getByLabel('user message 1');
    await expect(userMessage).toContainText('[E-MAIL]');
    await expect(userMessage).toContainText('[TELEFONNUMMER]');
    await expect(userMessage).not.toContainText('maria.muster@schule-beispiel.de');
  } finally {
    await setAnonymizationEnabled(false);
  }
});

test('person names and locations are anonymized via the Presidio service', async ({ page }) => {
  test.skip(
    !process.env.ANONYMIZATION_SERVICE_URL,
    'requires a running Presidio analyzer (ANONYMIZATION_SERVICE_URL)',
  );

  await setAnonymizationEnabled(true);

  try {
    await login(page, 'teacher');
    await sendMessage(page, 'Antworte nur mit OK. Anna Schmidt wohnt in München.');

    await page.reload();

    const userMessage = page.getByLabel('user message 1');
    await expect(userMessage).toContainText('[PERSON]');
    await expect(userMessage).toContainText('[ORT]');
    await expect(userMessage).not.toContainText('Anna Schmidt');
  } finally {
    await setAnonymizationEnabled(false);
  }
});

test('user message keeps PII when the toggle is disabled', async ({ page }) => {
  await setAnonymizationEnabled(false);

  await login(page, 'teacher');
  await sendMessage(page, 'Antworte nur mit OK. Kontakt: maria.muster@schule-beispiel.de.');

  await page.reload();

  await expect(page.getByLabel('user message 1')).toContainText('maria.muster@schule-beispiel.de');
});
