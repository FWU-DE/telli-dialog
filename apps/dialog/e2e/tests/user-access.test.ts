import { test, expect } from '@playwright/test';
import { login } from '../utils/login';
import { db } from '@shared/db';
import { federalStateTable } from '@shared/db/schema';
import { eq } from 'drizzle-orm';

const featureToggleDefaults = {
  isStudentAccessEnabled: true,
  isCharacterEnabled: true,
  isCustomGptEnabled: true,
  isSharedChatEnabled: true,
  isShareTemplateWithSchoolEnabled: true,
};

test('login as student with students disabled', async ({ page }) => {
  await db
    .update(federalStateTable)
    .set({ featureToggles: { ...featureToggleDefaults, isStudentAccessEnabled: false } })
    .where(eq(federalStateTable.id, 'DE-BY'));

  await login(page, 'student');

  await expect(page.getByText('Nutzung nicht möglich')).toBeVisible();

  await db
    .update(federalStateTable)
    .set({ featureToggles: { ...featureToggleDefaults, isStudentAccessEnabled: true } })
    .where(eq(federalStateTable.id, 'DE-BY'));
});

test('login as student with students enabled', async ({ page }) => {
  await db
    .update(federalStateTable)
    .set({ featureToggles: { ...featureToggleDefaults, isStudentAccessEnabled: true } })
    .where(eq(federalStateTable.id, 'DE-BY'));

  await login(page, 'student');

  await expect(page.getByText('Nutzung nicht möglich')).not.toBeVisible();
});

test('login as teacher with certification required', async ({ page }) => {
  await db
    .update(federalStateTable)
    .set({ mandatoryCertificationTeacher: true })
    .where(eq(federalStateTable.id, 'DE-BY'));

  await login(page, 'teacher');

  await expect(page.getByText('Nutzung nicht möglich')).toBeVisible();

  await db
    .update(federalStateTable)
    .set({ mandatoryCertificationTeacher: null })
    .where(eq(federalStateTable.id, 'DE-BY'));
});

test('login as teacher with certification not required', async ({ page }) => {
  await db
    .update(federalStateTable)
    .set({ mandatoryCertificationTeacher: null })
    .where(eq(federalStateTable.id, 'DE-BY'));

  await login(page, 'teacher');

  await expect(page.getByText('Nutzung nicht möglich')).not.toBeVisible();
});
