import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { configureCharacter } from '../../utils/character';
import { nanoid } from 'nanoid';

const characterTeacher = 'Character by teacher - ' + nanoid(8);
const characterTeacher2 = 'Character by teacher2 - ' + nanoid(8);
const characterTeacher3 = 'Character by teacher3 - ' + nanoid(8);

test.describe('share character school-wide', () => {
  test.beforeAll(async ({ browser }) => {
    // Create character as teacher (shared to school1)
    let page = await browser.newPage({ storageState: AUTH_FILES.teacher });
    await page.goto('/characters');
    await page.waitForURL('/characters**');
    const createButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
    await expect(createButton).toBeVisible();
    await createButton.click();
    await page.waitForURL('/characters/editor/**');
    await page.getByRole('checkbox', { name: 'Schulintern' }).click();
    await configureCharacter(page, {
      name: characterTeacher,
      description: 'Created by teacher',
      instructions: 'Teacher character',
    });
    await page.close();

    // Create character as teacher2 (shared to school1 & school2)
    page = await browser.newPage({ storageState: AUTH_FILES.teacher2 });
    await page.goto('/characters');
    await page.waitForURL('/characters**');
    await expect(page.getByRole('button', { name: 'Dialogpartner erstellen' })).toBeVisible();
    await page.getByRole('button', { name: 'Dialogpartner erstellen' }).click();
    await page.waitForURL('/characters/editor/**');
    await page.getByRole('checkbox', { name: 'Schulintern' }).click();
    await configureCharacter(page, {
      name: characterTeacher2,
      description: 'Created by teacher2',
      instructions: 'Teacher2 character',
    });
    await page.close();

    // Create character as teacher3 (shared to school2 & school3)
    page = await browser.newPage({ storageState: AUTH_FILES.teacher3 });
    await page.goto('/characters');
    await page.waitForURL('/characters**');
    await expect(page.getByRole('button', { name: 'Dialogpartner erstellen' })).toBeVisible();
    await page.getByRole('button', { name: 'Dialogpartner erstellen' }).click();
    await page.waitForURL('/characters/editor/**');
    await page.getByRole('checkbox', { name: 'Schulintern' }).click();
    await configureCharacter(page, {
      name: characterTeacher3,
      description: 'Created by teacher3',
      instructions: 'Teacher3 character',
    });
    await page.close();
  });

  // Teacher's perspective (school1)
  test.use({ storageState: AUTH_FILES.teacher });

  test('teacher sees character shared by teacher2 (same school)', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForURL('/characters**');
    await expect(page.getByText(characterTeacher2).first()).toBeVisible();
  });

  test('teacher does not see character shared by teacher3 (different schools)', async ({
    page,
  }) => {
    await page.goto('/characters');
    await page.waitForURL('/characters**');
    await expect(page.getByText(characterTeacher3).first()).not.toBeVisible();
  });

  // Teacher2's perspective (school1 & school2)
  test.use({ storageState: AUTH_FILES.teacher2 });

  test('teacher2 sees character shared by teacher (shared school)', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForURL('/characters**');
    await expect(page.getByText(characterTeacher).first()).toBeVisible();
  });

  test('teacher2 sees character shared by teacher3 (shared school)', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForURL('/characters**');
    await expect(page.getByText(characterTeacher3).first()).toBeVisible();
  });

  // Teacher3's perspective (school2 & school3)
  test.use({ storageState: AUTH_FILES.teacher3 });

  test('teacher3 sees character shared by teacher2 (shared school)', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForURL('/characters**');
    await expect(page.getByText(characterTeacher2).first()).toBeVisible();
  });

  test('teacher3 does not see character shared by teacher (different schools)', async ({
    page,
  }) => {
    await page.goto('/characters');
    await page.waitForURL('/characters**');
    await expect(page.getByText(characterTeacher).first()).not.toBeVisible();
  });
});
