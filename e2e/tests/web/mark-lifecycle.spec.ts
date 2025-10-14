/**
 * E2E Test: Mark Lifecycle
 * Tests complete lifecycle of quality marks from generation to validation
 */

import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { TestDataManager } from '../../utils/test-data-manager';
import { ApiClient } from '../../utils/api-client';

test.describe('Mark Lifecycle E2E', () => {
  let page: Page;
  let testData: TestDataManager;
  let apiClient: ApiClient;

  test.beforeAll(async () => {
    testData = new TestDataManager();
    apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:3001');
    await testData.seed();
  });

  test.afterAll(async () => {
    await testData.cleanup();
  });

  test.describe('Mark Generation Flow', () => {
    test('should generate marks for production batch successfully', async ({ page }) => {
      // Step 1: Login as manager
      await test.step('Login as manager', async () => {
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'manager@znak-lavki.com');
        await page.fill('[data-testid="password-input"]', 'Test123!@#');
        await page.click('[data-testid="login-button"]');

        // Wait for redirect to dashboard
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.locator('[data-testid="user-name"]')).toContainText('Manager');
      });

      // Step 2: Navigate to mark generation page
      await test.step('Navigate to mark generation', async () => {
        await page.click('[data-testid="sidebar-marks"]');
        await page.click('[data-testid="create-marks-button"]');

        await expect(page.locator('h1')).toContainText('Создать марки');
      });

      // Step 3: Fill form with valid data
      const batchData = {
        gtin: faker.string.numeric(13),
        quantity: 100,
        productionDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        supplierId: faker.number.int({ min: 1000, max: 9999 }),
        manufacturerId: faker.number.int({ min: 10000, max: 99999 }),
      };

      await test.step('Fill generation form', async () => {
        await page.fill('[data-testid="gtin-input"]', batchData.gtin);
        await page.fill('[data-testid="quantity-input"]', batchData.quantity.toString());
        await page.fill('[data-testid="production-date"]', batchData.productionDate);
        await page.fill('[data-testid="expiry-date"]', batchData.expiryDate);
        await page.fill('[data-testid="supplier-id"]', batchData.supplierId.toString());
        await page.fill('[data-testid="manufacturer-id"]', batchData.manufacturerId.toString());
      });

      // Step 4: Submit and verify marks created
      let generatedMarkCodes: string[];

      await test.step('Submit form and verify creation', async () => {
        const [response] = await Promise.all([
          page.waitForResponse(
            (resp) => resp.url().includes('/api/v1/marks/generate') && resp.status() === 201,
          ),
          page.click('[data-testid="submit-button"]'),
        ]);

        const responseData = await response.json();
        expect(responseData.count).toBe(batchData.quantity);
        expect(responseData.marks).toHaveLength(batchData.quantity);

        generatedMarkCodes = responseData.marks.map((m: any) => m.markCode);

        // Verify success message
        await expect(page.locator('[data-testid="success-message"]')).toContainText(
          `Успешно создано ${batchData.quantity} марок`,
        );
      });

      // Step 5: Download QR codes PDF
      await test.step('Download QR codes PDF', async () => {
        const downloadPromise = page.waitForEvent('download');
        await page.click('[data-testid="download-qr-button"]');
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(/qr-codes.*\.pdf/);

        // Save download for verification
        await download.saveAs(`./reports/downloads/${download.suggestedFilename()}`);
      });

      // Step 6: Verify in database via API
      await test.step('Verify marks in database', async () => {
        const marks = await apiClient.get(`/api/v1/marks?gtin=${batchData.gtin}`);

        expect(marks.data).toHaveLength(batchData.quantity);
        expect(marks.data.every((m: any) => m.status === 'active')).toBe(true);
        expect(marks.data.every((m: any) => m.gtin === batchData.gtin)).toBe(true);

        // Verify mark codes match
        const dbMarkCodes = marks.data.map((m: any) => m.markCode);
        expect(dbMarkCodes.sort()).toEqual(generatedMarkCodes.sort());
      });
    });

    test('should handle validation errors in generation form', async ({ page }) => {
      await page.goto('/marks/generate');

      // Try to submit with invalid GTIN
      await page.fill('[data-testid="gtin-input"]', '123'); // Too short
      await page.fill('[data-testid="quantity-input"]', '15000'); // Too many
      await page.click('[data-testid="submit-button"]');

      // Verify error messages
      await expect(page.locator('[data-testid="gtin-error"]')).toContainText(
        'GTIN должен содержать 13 цифр',
      );
      await expect(page.locator('[data-testid="quantity-error"]')).toContainText(
        'Максимальное количество: 10000',
      );
    });
  });

  test.describe('Mark Blocking Flow', () => {
    test('should block expired marks automatically', async ({ page }) => {
      // Step 1: Create marks with short expiry via API
      const shortExpiryDate = new Date(Date.now() + 2000); // 2 seconds
      let testMarkCodes: string[];

      await test.step('Create marks with short expiry', async () => {
        const response = await apiClient.post('/api/v1/marks/generate', {
          gtin: faker.string.numeric(13),
          quantity: 5,
          productionDate: new Date().toISOString(),
          expiryDate: shortExpiryDate.toISOString(),
          generateQrCodes: false,
        });

        testMarkCodes = response.marks.map((m: any) => m.markCode);
        expect(testMarkCodes).toHaveLength(5);
      });

      // Step 2: Wait for marks to expire
      await test.step('Wait for expiration', async () => {
        await page.waitForTimeout(3000); // Wait for marks to expire
      });

      // Step 3: Trigger cron job manually or wait
      await test.step('Trigger expiry check', async () => {
        // In real scenario, cron job would run
        // For testing, we can call the scheduler directly
        await apiClient.post('/api/v1/admin/schedulers/check-expired');
      });

      // Step 4: Verify marks are blocked
      await test.step('Verify marks blocked', async () => {
        for (const markCode of testMarkCodes) {
          const mark = await apiClient.get(`/api/v1/marks/code/${markCode}`);
          expect(mark.status).toBe('expired');
          expect(mark.blockedReason).toContain('Истёк срок годности');
        }
      });

      // Step 5: Check notifications sent
      await test.step('Verify notifications sent', async () => {
        const auditLogs = await apiClient.get('/api/v1/audit/logs', {
          params: { action: 'mark_expired', limit: 10 },
        });

        expect(auditLogs.data.length).toBeGreaterThanOrEqual(5);
      });
    });

    test('should manually block and unblock marks', async ({ page }) => {
      await page.goto('/marks');

      // Select some marks
      await page.click('[data-testid="mark-row-1"] [data-testid="checkbox"]');
      await page.click('[data-testid="mark-row-2"] [data-testid="checkbox"]');

      // Block marks
      await page.click('[data-testid="bulk-block-button"]');
      await page.fill('[data-testid="block-reason"]', 'Quality issue detected');
      await page.click('[data-testid="confirm-block"]');

      // Verify blocked
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Заблокировано: 2',
      );

      // Unblock marks
      await page.click('[data-testid="bulk-unblock-button"]');
      await page.click('[data-testid="confirm-unblock"]');

      // Verify unblocked
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Разблокировано: 2',
      );
    });
  });

  test.describe('Mark Validation Flow', () => {
    test('should validate active mark successfully', async ({ page }) => {
      // Create a test mark
      const response = await apiClient.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 1,
        productionDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const markCode = response.marks[0].markCode;

      // Navigate to validation page
      await page.goto('/marks/validate');
      await page.fill('[data-testid="mark-code-input"]', markCode);
      await page.click('[data-testid="validate-button"]');

      // Verify validation result
      await expect(page.locator('[data-testid="validation-status"]')).toHaveClass(/success/);
      await expect(page.locator('[data-testid="validation-message"]')).toContainText(
        'Марка валидна',
      );
    });

    test('should reject blocked mark', async ({ page }) => {
      // Create and block a mark
      const response = await apiClient.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 1,
      });

      const markCode = response.marks[0].markCode;
      await apiClient.put(`/api/v1/marks/${markCode}/block`, {
        reason: 'Test block',
      });

      // Try to validate blocked mark
      await page.goto('/marks/validate');
      await page.fill('[data-testid="mark-code-input"]', markCode);
      await page.click('[data-testid="validate-button"]');

      // Verify validation fails
      await expect(page.locator('[data-testid="validation-status"]')).toHaveClass(/error/);
      await expect(page.locator('[data-testid="validation-message"]')).toContainText(
        'Марка заблокирована',
      );
    });
  });

  test.describe('Dashboard and Analytics', () => {
    test('should display correct metrics on dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Wait for metrics to load
      await page.waitForSelector('[data-testid="metrics-loaded"]');

      // Verify metrics are displayed
      await expect(page.locator('[data-testid="total-marks"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-marks"]')).toBeVisible();
      await expect(page.locator('[data-testid="blocked-marks"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-count"]')).toBeVisible();

      // Verify charts are rendered
      await expect(page.locator('[data-testid="status-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="trends-chart"]')).toBeVisible();
    });

    test('should filter marks by status and date range', async ({ page }) => {
      await page.goto('/marks');

      // Apply status filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-active"]');

      // Wait for filtered results
      await page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/marks') && resp.url().includes('status=active'),
      );

      // Verify all displayed marks are active
      const statusBadges = await page.locator('[data-testid="mark-status"]').all();
      for (const badge of statusBadges) {
        await expect(badge).toContainText('Активная');
      }

      // Apply date range
      const today = new Date().toISOString().split('T')[0];
      await page.fill('[data-testid="date-from"]', today);
      await page.fill('[data-testid="date-to"]', today);
      await page.click('[data-testid="apply-filters"]');

      // Verify results are filtered
      await expect(page.locator('[data-testid="results-count"]')).toBeVisible();
    });
  });

  test.describe('Bulk Operations', () => {
    test('should handle bulk block of 1000 marks', async ({ page }) => {
      // Create 1000 test marks via API
      await test.step('Create 1000 test marks', async () => {
        await apiClient.post('/api/v1/marks/generate', {
          gtin: faker.string.numeric(13),
          quantity: 1000,
          productionDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          generateQrCodes: false,
        });
      });

      await page.goto('/marks');

      // Select all marks
      await page.click('[data-testid="select-all-checkbox"]');

      // Verify selection count
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('1000');

      // Block all selected marks
      await page.click('[data-testid="bulk-block-button"]');
      await page.fill('[data-testid="block-reason"]', 'Bulk test block');
      await page.click('[data-testid="confirm-block"]');

      // Wait for operation to complete (might take a while)
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Заблокировано: 1000',
        { timeout: 60000 },
      );
    });
  });

  test.describe('Export Functionality', () => {
    test('should export marks to Excel', async ({ page }) => {
      await page.goto('/marks');

      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-button"]');
      await page.click('[data-testid="export-excel"]');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/marks.*\.xlsx/);
    });

    test('should export marks to PDF', async ({ page }) => {
      await page.goto('/marks');

      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-button"]');
      await page.click('[data-testid="export-pdf"]');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/marks.*\.pdf/);
    });
  });
});
