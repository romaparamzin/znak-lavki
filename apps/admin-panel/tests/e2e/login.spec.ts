/**
 * Login E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login button
    await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
    
    // Check for title
    await expect(page.getByText('Знак Лавки')).toBeVisible();
  });

  test('should have OAuth button', async ({ page }) => {
    await page.goto('/login');
    
    const loginButton = page.getByRole('button', { name: /войти через yandex/i });
    await expect(loginButton).toBeVisible();
  });

  test('login button should be clickable', async ({ page }) => {
    await page.goto('/login');
    
    const loginButton = page.getByRole('button', { name: /войти через yandex/i });
    await expect(loginButton).toBeEnabled();
  });
});


