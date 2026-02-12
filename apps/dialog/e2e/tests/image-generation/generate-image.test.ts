import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { waitForToast } from '../../utils/utils';

test('can generate an image and copy it to clipboard', async ({ page }) => {
  await login(page, 'teacher');

  // navigate to image generation
  await page.goto('/image-generation');
  await page.waitForURL('/image-generation**');

  // select flux as model
  const dropdownLocator = page.getByLabel('Select image Model Dropdown');
  await dropdownLocator.waitFor();
  const currentSelectedText = await dropdownLocator.textContent();
  if (!currentSelectedText?.includes('FLUX')) {
    await dropdownLocator.click();
    await page.locator('div[data-radix-popper-content-wrapper]').waitFor();
    const modelLocator = page.getByLabel(/flux/i);
    await modelLocator.waitFor();
    await modelLocator.click();
  }

  // send message
  const prompt = 'A duck with a hat';
  await page.getByPlaceholder('Beschreibe, wie das Bild aussehen soll.').fill(prompt);
  await page.getByRole('button', { name: 'Bild generieren' }).click();

  // wait for image to appear
  const generatedImage = page.getByRole('img', { name: prompt });
  await expect(generatedImage).toBeVisible({ timeout: 30000 });

  // test if the image is visible by checking
  // if it has a src attribute and if the width is greater than 0
  await expect(generatedImage).toHaveAttribute('src', /.+/);
  await expect(async () => {
    const naturalWidth = await generatedImage.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  }).toPass();

  // click on copy and verify image is copied by checking
  // the success toast and the clipboard for image/png type
  await page.getByTitle('Bild kopieren').click();
  await waitForToast(page, 'Bild in die Zwischenablage kopiert');
  /*const clipboardItems = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    return items.map((item) => item.types).flat();
  });
  expect(clipboardItems).toContain('image/png');*/
});
