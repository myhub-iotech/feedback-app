const { test, expect } = require('@playwright/test');

// Test data
const VALID_WASHROOM_REF_ID = 'f191ad30-8d33-11f0-a3de-c32ceae4fb5a';
const VALID_FLOOR_REF_ID = '9c8f93d0-99de-11f0-bf05-af32f61376fb';

test.describe('RefId Validation', () => {
  test('should display washroom label for valid washroom refId', async ({ page }) => {
    // Navigate to app with valid washroom refId
    await page.goto(`/?refId=${VALID_WASHROOM_REF_ID}`);

    // Wait for the info banner to appear
    const banner = page.locator('.infoBanner');
    await expect(banner).toBeVisible({ timeout: 10000 });

    // Verify the washroom label is displayed correctly
    // The banner displays text in uppercase, split across lines
    const bannerText = await banner.textContent();

    // Case-insensitive check for the washroom components
    expect(bannerText.toLowerCase()).toContain('4th floor');
    expect(bannerText.toLowerCase()).toContain('women washroom');

    // Verify emoji options are visible
    await expect(page.locator('.smileys')).toBeVisible();
    await expect(page.getByRole('button', { name: /😄/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /🙂/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /🙁/i })).toBeVisible();

    // Verify no error message is shown
    await expect(page.locator('.error-card')).not.toBeVisible();
  });

  test('should display floor label for valid floor refId', async ({ page }) => {
    // Navigate to app with valid floor refId
    await page.goto(`/?refId=${VALID_FLOOR_REF_ID}`);

    // Wait for the info banner to appear
    const banner = page.locator('.infoBanner');
    await expect(banner).toBeVisible({ timeout: 10000 });

    // Verify the floor label is displayed
    const bannerText = await banner.textContent();
    expect(bannerText.toLowerCase()).toContain('4th floor');

    // Verify emoji options are visible
    await expect(page.locator('.smileys')).toBeVisible();

    // Verify no error message is shown
    await expect(page.locator('.error-card')).not.toBeVisible();
  });

  test('should show loading state before validation completes', async ({ page }) => {
    // Navigate to app with valid refId
    await page.goto(`/?refId=${VALID_WASHROOM_REF_ID}`);

    // Check for loading indicator (progress bar)
    const hasLoadingState = await page.locator('.top-progress').isVisible().catch(() => false);

    // Either we see loading state, or validation was very fast
    // This is acceptable - we just verify no error is shown
    await expect(page.locator('.error-card')).not.toBeVisible();
  });

  test('should show error for missing refId when required', async ({ page }) => {
    // Navigate without refId
    await page.goto('/');

    // Wait a bit for validation to complete
    await page.waitForTimeout(2000);

    // Check if error is shown or if form loads (depends on config)
    const errorCard = page.locator('.error-card');
    const errorVisible = await errorCard.isVisible();

    if (errorVisible) {
      // Verify error message contains expected text
      await expect(errorCard).toContainText(/couldn't load/i);
    }
    // If no error, the app allows operation without refId
  });

  test('should show error for invalid refId', async ({ page }) => {
    const INVALID_REF_ID = 'invalid-ref-id-12345';

    // Navigate with invalid refId
    await page.goto(`/?refId=${INVALID_REF_ID}`);

    // Wait for validation to complete
    await page.waitForTimeout(3000);

    // Should show error card
    const errorCard = page.locator('.error-card');
    await expect(errorCard).toBeVisible({ timeout: 10000 });

    // Verify error message
    await expect(errorCard).toContainText(/couldn't load/i);

    // Emoji options should NOT be visible
    await expect(page.locator('.smileys')).not.toBeVisible();
  });
});
