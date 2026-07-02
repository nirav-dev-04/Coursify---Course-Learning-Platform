import { test, expect } from './fixtures/auth';
import { setupErrorHandlers } from './utils/errors';

test.describe('Student Q&A Empty State', () => {

  test('should display a styled empty state layout when there are zero student discussions', async ({ instructorPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    // Force zero discussions from the backend endpoint
    await page.route('**/api/discussions/instructor', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/instructor/dashboard');

    // Click Student Q&A tab
    const qaTab = page.locator('[data-testid="tab-qa"]');
    await qaTab.click();

    // Verify empty state container and copy text
    const emptyState = page.locator('[data-testid="qa-empty-state"]');
    await expect(emptyState).toBeVisible();

    const titleText = emptyState.locator('h3');
    await expect(titleText).toHaveText('No questions yet');

    const descText = emptyState.locator('p');
    await expect(descText).toContainText('Once students start your course, their questions and discussions will show up here');

    errorHandlers.assertNoErrors();
  });
});
