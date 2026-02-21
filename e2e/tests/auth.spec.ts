import { test, expect } from '@playwright/test';
import {
  TEST_PASSWORD,
  registerUserViaApi,
  loginViaUi,
} from './helpers/auth.helper';

test.describe('Authentication', () => {
  test('visiting the home page shows the landing page', async ({ page }) => {
    await page.goto('/');

    // The landing page should display the app name and call-to-action buttons
    await expect(page.getByText('Grocery20')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /start planning today/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /sign in/i }),
    ).toBeVisible();
  });

  test('registers a new account and redirects to dashboard', async ({
    page,
  }) => {
    const email = `e2e+${Date.now()}@example.com`;

    await page.goto('/register');

    await page.getByLabel('Full Name').fill('E2E User');
    await page.getByLabel('Email').fill(email);

    // The register page has two password fields; target by label text
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel('Confirm Password').fill(TEST_PASSWORD);

    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  });

  test('logs in with valid credentials and redirects to dashboard', async ({
    page,
    request,
  }) => {
    const email = await registerUserViaApi(request);

    await loginViaUi(page, email);

    // After login the URL should include /dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('shows an error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('WrongPassword1!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // The login page renders an Alert with role="alert" on failure
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('logout redirects to home page', async ({ page, request }) => {
    const email = await registerUserViaApi(request);
    await loginViaUi(page, email);

    // The logout button is in the main layout with aria-label "Logout"
    await page.getByRole('button', { name: /logout/i }).click();

    // After logout the user should land back on the home or login page
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 });
  });
});
