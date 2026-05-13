import { expect, type Page, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';

test.use({
  storageState: AUTH_FILES.teacher,
  video: 'on',
});

async function selectFluxModel(page: Page) {
  const dropdown = page.getByLabel('Select image Model Dropdown');
  await dropdown.waitFor();
  const text = await dropdown.textContent();
  if (!text?.includes('FLUX')) {
    await dropdown.click();
    await page.locator('div[data-radix-popper-content-wrapper]').waitFor();
    await page.getByLabel(/flux/i).click();
  }
}

async function openAssistantAndWaitForResponse(page: Page, buttonName: string) {
  await page.getByRole('button', { name: buttonName }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  // wait for the loading spinner to disappear (LLM responded)
  await expect(sheet.locator('svg').filter({ has: page.locator('[class*="animate"]') })).toBeHidden({
    timeout: 30000,
  });
  return sheet;
}

// ── Test 1: fresh conversation, no pre-prompt ──────────────────────────────

test('image assistant - starts fresh conversation without pre-prompt', async ({ page }) => {
  await page.goto('/image-generation');
  await page.waitForURL('/image-generation**');

  // Input box must be empty
  const promptInput = page.getByPlaceholder('Beschreibe, wie das Bild aussehen soll.');
  await expect(promptInput).toHaveValue('');

  const sheet = await openAssistantAndWaitForResponse(page, 'Prompt-Assistent');

  await expect(sheet.getByRole('heading', { name: 'Bildassistent' })).toBeVisible();

  // LLM should have responded with at least one assistant bubble
  const firstBubble = sheet.locator('.bg-muted').first();
  await expect(firstBubble).toBeVisible();
  await expect(firstBubble).not.toBeEmpty();

  // The response should contain a question (no FINAL_PROMPT yet)
  const usePromptButton = sheet.getByRole('button', { name: /Prompt verwenden/i });
  await expect(usePromptButton).not.toBeVisible();
});

// ── Test 2: assistant with existing input prompt ───────────────────────────

test('image assistant - asks to reuse existing input text', async ({ page }) => {
  await page.goto('/image-generation');
  await page.waitForURL('/image-generation**');

  // Pre-fill the input box with a partial prompt
  const promptInput = page.getByPlaceholder('Beschreibe, wie das Bild aussehen soll.');
  await promptInput.fill('Ein roter Drache in den Bergen');

  const sheet = await openAssistantAndWaitForResponse(page, 'Prompt-Assistent');

  // The LLM should ask whether to use the existing text and show option chips
  const chips = sheet.locator('button.rounded-full');
  await expect(chips.first()).toBeVisible({ timeout: 10000 });

  // Expect at least the two options: "Ja" and "Nein"
  expect(await chips.count()).toBeGreaterThanOrEqual(2);

  // Click the "Ja" chip to use the existing prompt
  const yesChip = chips.filter({ hasText: /ja/i }).first();
  await expect(yesChip).toBeVisible();
  await yesChip.click();

  // Assistant should now follow up with a targeted question
  expect(await sheet.locator('.bg-muted').count()).toBeGreaterThanOrEqual(2);
});

// ── Test 3: edit assistant after image generation ──────────────────────────

test('edit assistant - opens and starts conversation after image generation', async ({ page }) => {
  await page.goto('/image-generation');
  await page.waitForURL('/image-generation**');

  await selectFluxModel(page);

  // Generate an image first
  const prompt = 'A simple blue circle on white background';
  await page.getByPlaceholder('Beschreibe, wie das Bild aussehen soll.').fill(prompt);
  await page.getByRole('button', { name: 'Bild generieren' }).click();

  // Wait for the generated image to appear
  const generatedImage = page.getByRole('img', { name: prompt });
  await expect(generatedImage).toBeVisible({ timeout: 60000 });

  // Open the edit assistant
  const sheet = await openAssistantAndWaitForResponse(page, 'Bild anpassen');

  await expect(sheet.getByRole('heading', { name: 'Bild anpassen' })).toBeVisible();

  // LLM should have responded about what to change
  const firstBubble = sheet.locator('.bg-muted').first();
  await expect(firstBubble).toBeVisible();
  await expect(firstBubble).not.toBeEmpty();

  // Simulate user input asking for a color change
  const input = sheet.getByPlaceholder('Deine Antwort...');
  await input.fill('Mach den Kreis grün statt blau');
  await sheet.getByRole('button', { name: 'Senden' }).click();

  // Wait for the assistant to respond again
  expect(await sheet.locator('.bg-muted').count()).toBeGreaterThanOrEqual(2);
});
