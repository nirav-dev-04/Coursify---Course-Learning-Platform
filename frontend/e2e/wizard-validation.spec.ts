import { test, expect } from './fixtures/auth';
import { setupErrorHandlers } from './utils/errors';

test.describe('Course Creation Wizard Form Validation', () => {

  test('should enforce strict step validations and prevent continue action on invalid inputs', async ({ instructorPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    await page.goto('/instructor/courses/create');

    // Step 1: Course Type
    const nextBtn = page.locator('[data-testid="wizard-next"]');
    await expect(nextBtn).toBeEnabled(); // Selected by default
    await nextBtn.click();

    // Step 2: Title validation (empty, whitespace)
    const titleInput = page.locator('[data-testid="wizard-input-title"]');
    await expect(nextBtn).toBeDisabled();

    // Test whitespace trim validation
    await titleInput.fill('   ');
    await expect(nextBtn).toBeDisabled();

    // Fill valid title
    await titleInput.fill('Valid Working Title');
    await expect(nextBtn).toBeEnabled();

    // Deleting title makes it disabled again
    await titleInput.fill('');
    await expect(nextBtn).toBeDisabled();

    await titleInput.fill('E2E Validation Test Course');
    await nextBtn.click();

    // Step 3: Category validation
    const categorySelect = page.locator('[data-testid="wizard-select-category"]');
    await expect(nextBtn).toBeDisabled();

    // Select valid category
    await categorySelect.selectOption('Software Engineering');
    await expect(nextBtn).toBeEnabled();

    // Re-select empty category
    await categorySelect.selectOption('');
    await expect(nextBtn).toBeDisabled();

    await categorySelect.selectOption('AI & Data Science');
    await nextBtn.click();

    // Step 4: Price & Description validation
    const descTextarea = page.locator('[data-testid="wizard-input-description"]');
    const priceInput = page.locator('[data-testid="wizard-input-price"]');
    const submitBtn = page.locator('[data-testid="wizard-submit"]');

    await expect(submitBtn).toBeDisabled();

    // Description only - price empty
    await descTextarea.fill('Test description');
    await expect(submitBtn).toBeDisabled();

    // Invalid negative price
    await priceInput.fill('-10');
    await expect(submitBtn).toBeDisabled();

    // Valid price 0 (Free course is valid)
    await priceInput.fill('0');
    await expect(submitBtn).toBeEnabled();

    // Valid positive price
    await priceInput.fill('299');
    await expect(submitBtn).toBeEnabled();

    errorHandlers.assertNoErrors();
  });
});
