import { test, expect } from '@playwright/test';
import { login } from '../utils/login';
import { db } from '@/db';
import { federalStateTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

test('login as student with students disabled', async ({ page }) => {
  await db
    .update(federalStateTable)
    .set({ studentAccess: false })
    .where(eq(federalStateTable.id, 'DE-BY'));

  await login(page, 'student');

  await expect(page.getByText('Nutzung nicht möglich')).toBeVisible();

  await db
    .update(federalStateTable)
    .set({ studentAccess: true })
    .where(eq(federalStateTable.id, 'DE-BY'));
});

test('login as student with students enabled', async ({ page }) => {
  await db
    .update(federalStateTable)
    .set({ studentAccess: true })
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
