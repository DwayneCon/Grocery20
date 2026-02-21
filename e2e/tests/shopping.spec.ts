import { test, expect } from '@playwright/test';
import {
  registerUserWithHouseholdViaApi,
  loginViaUi,
} from './helpers/auth.helper';

test.describe('Shopping List', () => {
  let email: string;

  test.beforeEach(async ({ page, request }) => {
    // Create a user with a household so the shopping list page works
    email = await registerUserWithHouseholdViaApi(request);
    await loginViaUi(page, email);
  });

  test('navigates to shopping list page', async ({ page }) => {
    await page.goto('/shopping-list');

    // The page header should show "Shopping Lists"
    await expect(page.getByRole('heading', { name: /shopping lists/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('creates a new shopping list', async ({ page }) => {
    await page.goto('/shopping-list');

    // Click the "New List" button
    await page.getByRole('button', { name: /new list/i }).click();

    // Fill in the list name in the dialog
    await page.getByLabel('List Name').fill('Weekly Groceries');
    await page.getByRole('button', { name: /^create$/i }).click();

    // The success message or the list should become visible
    await expect(page.getByText(/weekly groceries/i)).toBeVisible({ timeout: 10000 });
  });

  test('adds an item to the shopping list', async ({ page }) => {
    await page.goto('/shopping-list');

    // Create a list first if none exists
    await page.getByRole('button', { name: /new list/i }).click();
    await page.getByLabel('List Name').fill('Test List');
    await page.getByRole('button', { name: /^create$/i }).click();

    // Wait for list to load
    await expect(page.getByText(/test list/i)).toBeVisible({ timeout: 10000 });

    // Click the floating add button (aria-label="Add new item to shopping list")
    await page.getByLabel('Add new item to shopping list').click();

    // Fill in item details in the Add Item dialog
    await page.getByLabel('Item Name').fill('Milk');
    await page.getByRole('button', { name: /^add$/i }).click();

    // The item should appear in the list
    await expect(page.getByText('Milk')).toBeVisible({ timeout: 10000 });
  });

  test('toggles an item as purchased', async ({ page }) => {
    await page.goto('/shopping-list');

    // Create list and add an item
    await page.getByRole('button', { name: /new list/i }).click();
    await page.getByLabel('List Name').fill('Toggle Test');
    await page.getByRole('button', { name: /^create$/i }).click();
    await expect(page.getByText(/toggle test/i)).toBeVisible({ timeout: 10000 });

    await page.getByLabel('Add new item to shopping list').click();
    await page.getByLabel('Item Name').fill('Eggs');
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByText('Eggs')).toBeVisible({ timeout: 10000 });

    // Toggle the item as purchased using the checkbox button
    // The aria-label follows the pattern "Mark {name} as purchased"
    const toggleButton = page.getByLabel(/mark eggs as purchased/i);
    await toggleButton.click();

    // After toggling, the aria-label should change to "Mark Eggs as not purchased"
    await expect(
      page.getByLabel(/mark eggs as not purchased/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test('deletes an item from the list', async ({ page }) => {
    await page.goto('/shopping-list');

    // Create list and add an item
    await page.getByRole('button', { name: /new list/i }).click();
    await page.getByLabel('List Name').fill('Delete Test');
    await page.getByRole('button', { name: /^create$/i }).click();
    await expect(page.getByText(/delete test/i)).toBeVisible({ timeout: 10000 });

    await page.getByLabel('Add new item to shopping list').click();
    await page.getByLabel('Item Name').fill('Butter');
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(page.getByText('Butter')).toBeVisible({ timeout: 10000 });

    // Delete the item using the delete button (aria-label="Delete {name}")
    await page.getByLabel(/delete butter/i).click();

    // The item should no longer be visible
    await expect(page.getByText('Butter')).toBeHidden({ timeout: 10000 });
  });
});
