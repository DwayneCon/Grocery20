import { expect, type Page, type APIRequestContext } from '@playwright/test';

/** Default test password that meets the app's strength requirements. */
export const TEST_PASSWORD = 'Test123!@';

/**
 * Register a user via the backend API (bypassing the UI).
 * Returns the email used so callers can log in afterwards.
 */
export async function registerUserViaApi(
  request: APIRequestContext,
  overrides: { name?: string; email?: string; password?: string } = {},
): Promise<string> {
  const email = overrides.email ?? `e2e+${Date.now()}@example.com`;
  const api = await request.newContext({ baseURL: 'http://localhost:3001' });
  await api.post('/api/auth/register', {
    data: {
      name: overrides.name ?? 'E2E User',
      email,
      password: overrides.password ?? TEST_PASSWORD,
    },
  });
  await api.dispose();
  return email;
}

/**
 * Register a user and create a household via the backend API.
 * Returns the email used so callers can log in afterwards.
 */
export async function registerUserWithHouseholdViaApi(
  request: APIRequestContext,
  overrides: {
    name?: string;
    email?: string;
    password?: string;
    householdName?: string;
    budgetWeekly?: number;
  } = {},
): Promise<string> {
  const email = overrides.email ?? `e2e+${Date.now()}@example.com`;
  const password = overrides.password ?? TEST_PASSWORD;
  const api = await request.newContext({ baseURL: 'http://localhost:3001' });

  await api.post('/api/auth/register', {
    data: {
      name: overrides.name ?? 'E2E User',
      email,
      password,
    },
  });

  const loginRes = await api.post('/api/auth/login', {
    data: { email, password },
  });

  const token = (await loginRes.json()).accessToken;

  await api.post('/api/households', {
    data: {
      name: overrides.householdName ?? 'E2E Household',
      budgetWeekly: overrides.budgetWeekly ?? 120,
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  await api.dispose();
  return email;
}

/**
 * Log in through the UI. Assumes the user already exists.
 * Waits for the redirect to /dashboard before returning.
 */
export async function loginViaUi(
  page: Page,
  email: string,
  password: string = TEST_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
}
