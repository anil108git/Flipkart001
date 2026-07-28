import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL ?? '';
  const password = process.env.TEST_USER_PASSWORD ?? '';

  await page.goto(process.env.BASE_URL ?? '');

  // Click login, fill credentials, submit
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: /email|mobile/i }).fill(email);
  await page.getByRole('textbox', { name: /password/i }).fill(password);
  await page.getByRole('button', { name: /login|submit/i }).click();

  // Wait for successful login redirect
  await expect(page.getByRole('link', { name: /account|profile|logout/i })).toBeVisible({ timeout: 15000 });

  // Save storage state
  await page.context().storageState({ path: authFile });
});
