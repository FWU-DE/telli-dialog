import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { waitForToast, waitForToastDisappear } from '../../utils/utils';
import { sendMessage } from '../../utils/chat';
import {
  configureLearningScenario,
  createLearningScenario,
  deleteLearningScenario,
  deleteLearningScenarioFromDetailPage,
} from '../../utils/learning-scenario';
import { nanoid } from 'nanoid';

test.describe('create, share, chat, delete', () => {
  const data = {
    additionalInstructions:
      'Der Chatbot soll aus der Perspektive eines Soldaten im Herrschaftssystem unter Ludwig XIV antworten.',
    description: 'Zwischen Absolutismus und Demokratie (Ludwig XIV)',
    gradeLevel: '10. Klasse',
    name: '', // will be set in beforeEach
    schoolType: 'Gymnasium',
    studentExercise:
      'Schüler sollen den Unterschied zwischen Absolutismus und Demokratie verstehen.',
    subject: 'Geschichte',
  };

  test.beforeEach(() => {
    data.name = 'Absolutismus unter Ludwig XIV – ' + nanoid(8);
  });

  test('teacher can login, create and join learning scenario', async ({ page }) => {
    await login(page, 'teacher');

    await createLearningScenario(page);

    // configure form
    await configureLearningScenario(page, data);

    // In the new UI, form auto-saves, so navigate back to verify creation
    const listItem = page.getByRole('button', { name: data.name });
    await expect(listItem).toBeVisible();
    await listItem.click();
    await page.waitForURL('/learning-scenarios/**');

    // check if created with the correct name
    await expect(page.getByRole('heading', { name: data.name })).toBeVisible();

    const stopSharingButton = page.getByRole('button', { name: 'Stop' });
    if (await stopSharingButton.isVisible()) {
      await stopSharingButton.click();
    }
    // test share page
    await page.selectOption('#Telli-Points', '50');
    await page.selectOption('#maxUsage', '30');
    await page.getByTitle('Szenario starten').click();

    await page.waitForURL('/learning-scenarios/**/share');
    const code = await page.locator('#join-code').textContent();

    const countDown = page.locator('#countdown-timer');
    await expect(countDown).toBeVisible();

    const qrCode = page.locator('#qr-code');
    await expect(qrCode).toBeVisible();

    // join chat as teacher
    await page.goto('/logout');
    await page.waitForURL('/login');

    await page.locator('#login-invite-code').fill(code ?? '');

    const loginButton = page.getByRole('button', { name: 'Zum Dialog' });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await page.waitForURL('/ua/learning-scenarios/**/dialog?inviteCode=*');
  });

  test('teacher can login and create learning scenario, student can join and restart chat', async ({
    page,
  }) => {
    await login(page, 'teacher');

    await createLearningScenario(page);

    // configure form
    await configureLearningScenario(page, data);

    // In the new UI, form auto-saves, so navigate back to verify creation
    const listItem = page.getByRole('button', { name: data.name });
    await expect(listItem).toBeVisible();
    await listItem.click();

    await page.waitForURL('/learning-scenarios/**');
    const stopSharingButton = page.getByRole('button', { name: 'Stop' });
    if (await stopSharingButton.isVisible()) {
      await stopSharingButton.click();
    }
    // test share page
    await page.selectOption('#Telli-Points', '25');
    await page.selectOption('#maxUsage', '30');
    await page.getByTitle('Szenario starten').click();

    // get code
    await page.waitForURL('/learning-scenarios/**/share');
    const code = await page.locator('#join-code').textContent();

    // join chat as student
    await page.goto('/logout');
    await page.waitForURL('/login');

    await page.locator('#login-invite-code').fill(code ?? '');

    const loginButton = page.getByRole('button', { name: 'Zum Dialog' });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await page.waitForURL('/ua/learning-scenarios/**/dialog?inviteCode=*');

    // send first message
    const startButton = page.getByRole('button', { name: 'Dialog starten' });
    await expect(startButton).toBeVisible();
    await startButton.click();

    await sendMessage(page, 'Über wen lernen wir hier?');

    await expect(page.getByLabel('assistant message 1')).toContainText('Ludwig XIV');

    // new chat
    const newChatButton = page.locator('#destructive-button');
    await expect(newChatButton).toBeVisible();
    await newChatButton.click();

    const deleteConfirmButton = page.getByRole('button', {
      name: 'Aktuellen Chat verwerfen und neu beginnen',
    });
    await expect(deleteConfirmButton).toBeVisible();
    await deleteConfirmButton.click();
  });

  test('teacher can delete learning scenario', async ({ page }) => {
    await login(page, 'teacher');
    // create learning scenario
    await createLearningScenario(page);
    await configureLearningScenario(page, data);
    // In the new UI, form auto-saves, so navigate back to verify creation
    const listItem = page.getByRole('button', { name: data.name });
    await expect(listItem).toBeVisible();

    await deleteLearningScenario(page, data.name);

    await waitForToast(page, 'Das Lernszenario wurde erfolgreich gelöscht.');
    await expect(page.getByRole('heading', { name: data.name })).not.toBeVisible();
  });
});

test('data is autosaved on blur', async ({ page }) => {
  await login(page, 'teacher');
  await createLearningScenario(page);

  // Fill out the form initially
  const name = 'Autosave Test Scenario ' + nanoid(8);
  await configureLearningScenario(page, {
    name,
    additionalInstructions: 'Test behavior for autosave validation',
    description: 'Test description for autosave validation',
    studentExercise: 'Test task for autosave validation',
  });

  // Navigate back to list and then click to open for editing
  await page.waitForTimeout(300);
  const listItem = page.getByRole('button', { name });
  await expect(listItem).toBeVisible();
  await listItem.click();
  await page.waitForURL('/learning-scenarios/**');
  await waitForToastDisappear(page); // wait for success toast to disappear before continuing

  // Edit and verify autosave for each field
  // Title
  await page.getByLabel('Name des Lernszenarios').fill('New Title');
  await page.getByLabel('Name des Lernszenarios').press('Tab');
  await page.waitForTimeout(300);
  await expect(page.locator('text=Gespeichert')).toBeVisible({ timeout: 5000 });
  await page.reload();
  await expect(page.getByLabel('Name des Lernszenarios')).toHaveValue('New Title');

  // Description
  await page.getByLabel('Kurzbeschreibung').fill('New Description');
  await page.getByLabel('Kurzbeschreibung').press('Tab');
  await page.waitForTimeout(300);
  await expect(page.locator('text=Gespeichert')).toBeVisible({ timeout: 5000 });
  await page.reload();
  await expect(page.getByLabel('Kurzbeschreibung')).toHaveValue('New Description');

  // Instructions
  await page.getByLabel('Instruktionen').fill('New Instructions');
  await page.getByLabel('Instruktionen').press('Tab');
  await page.waitForTimeout(300);
  await expect(page.locator('text=Gespeichert')).toBeVisible({ timeout: 5000 });
  await page.reload();
  await expect(page.getByLabel('Instruktionen')).toHaveValue('New Instructions');

  // Student Exercise
  await page.getByLabel('Arbeitsauftrag').fill('New Exercise');
  await page.getByLabel('Arbeitsauftrag').press('Tab');
  await page.waitForTimeout(300);
  await expect(page.locator('text=Gespeichert')).toBeVisible({ timeout: 5000 });
  await page.reload();
  await expect(page.getByLabel('Arbeitsauftrag')).toHaveValue('New Exercise');

  // cleanup
  await deleteLearningScenarioFromDetailPage(page);
  await waitForToast(page);
});
