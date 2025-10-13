/**
 * Dashboard E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        permissions: [],
      }));
    });
  });

  test('should navigate to dashboard after login', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display dashboard title', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.getByRole('heading', { name: 'Дашборд' })).toBeVisible();
  });

  test('should display metric cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for metric titles
    await expect(page.getByText('Всего марок')).toBeVisible();
    await expect(page.getByText('Активные')).toBeVisible();
    await expect(page.getByText('Заблокированные')).toBeVisible();
    await expect(page.getByText('Истекшие')).toBeVisible();
  });

  test('should have working sidebar navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on "Марки" in sidebar
    await page.click('text=Марки');
    await expect(page).toHaveURL(/\/marks/);
    
    // Click on "Аналитика"
    await page.click('text=Аналитика');
    await expect(page).toHaveURL(/\/analytics/);
  });
});




