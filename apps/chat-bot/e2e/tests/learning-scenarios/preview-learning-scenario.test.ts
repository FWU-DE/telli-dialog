import { expect, test } from '@playwright/test';
import { nanoid } from 'nanoid';
import { AUTH_FILES } from '../../utils/const';
import { sendMessage } from '../../utils/chat';
import {
  configureLearningScenario,
  createLearningScenario,
  deleteLearningScenarioFromDetailPage,
} from '../../utils/learning-scenario';
import { waitForToast } from '../../utils/utils';

test.use({ storageState: AUTH_FILES.teacher });

test.describe('learning scenario preview chat (teacher test mode)', () => {
  const data = {
    name: 'Vorschau Test ' + nanoid(8),
    description: 'Ein einfaches Szenario, um die Vorschau zu testen.',
    additionalInstructions:
      'Antworte immer mit einem deutlich erkennbaren Hallo am Anfang jeder Antwort.',
    studentExercise: 'Frage den Chatbot nach einer Begrüßung.',
  };

  test('teacher can launch preview chat from editor and send a message without sharing', async ({
    page,
  }) => {
    await createLearningScenario(page);
    await configureLearningScenario(page, data);

    // Extract the learningScenarioId from the editor URL — needed to assert the preview route
    const editorUrl = page.url();
    const learningScenarioId = editorUrl.split('/learning-scenarios/editor/')[1]?.split(/[/?]/)[0];
    expect(learningScenarioId).toBeTruthy();

    // Sanity check: the scenario is NOT shared yet — no invite code page reached
    await expect(page).toHaveURL(/\/learning-scenarios\/editor\/[^/]+$/);

    // Click the new "Chatten" (CustomChatActionUse) button from the editor's action bar
    const chatButton = page.getByRole('button', { name: 'Chatten' });
    await expect(chatButton).toBeVisible();
    await chatButton.click();

    // The preview route must mirror /characters/d/[id]
    await page.waitForURL(`/learning-scenarios/d/${learningScenarioId}`);

    // The intro view shows the scenario name and a "Dialog starten" button
    await expect(page.getByRole('heading', { name: data.name })).toBeVisible();
    const startButton = page.getByRole('button', { name: 'Dialog starten' });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Send a test message — verifies the auth-backed preview endpoint works end-to-end
    await sendMessage(page, 'Sag Hallo.');

    // Assistant must have responded (we don't pin specific content — just that a reply exists)
    await expect(page.getByLabel('assistant message 1')).toBeVisible();

    // Cleanup: navigate back to editor and delete the scenario
    await page.goto(`/learning-scenarios/editor/${learningScenarioId}`);
    await page.waitForURL(/\/learning-scenarios\/editor\//);
    await deleteLearningScenarioFromDetailPage(page);
    await waitForToast(page, 'Das Lernszenario wurde erfolgreich gelöscht.');
  });
});
