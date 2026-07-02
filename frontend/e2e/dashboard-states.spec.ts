import { test, expect } from './fixtures/auth';
import { setupErrorHandlers } from './utils/errors';

test.describe('Instructor Dashboard States & Tabs', () => {

  test('should render skeleton loader during slow API responses', async ({ instructorPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    // Route interception to delay instructor courses fetch
    await page.route('**/api/courses/instructor/me', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.goto('/instructor/dashboard');
    
    // Assert skeleton loader is visible while API is pending
    const skeleton = page.locator('[data-testid="dashboard-skeleton-loader"]');
    await expect(skeleton).toBeVisible();

    // Wait for resolution and confirm skeleton disappears
    await expect(skeleton).not.toBeVisible();

    errorHandlers.assertNoErrors();
  });

  test('should display Udemy-inspired empty state when instructor has zero courses', async ({ instructorPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    // Force zero courses returned
    await page.route('**/api/courses/instructor/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/instructor/dashboard');

    // Confirm banners, cards, and CTA testids are rendered
    await expect(page.locator('[data-testid="cta-create-course-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="resource-card-engaging-course"]')).toBeVisible();
    await expect(page.locator('[data-testid="resource-card-video"]')).toBeVisible();
    await expect(page.locator('[data-testid="resource-card-audience"]')).toBeVisible();
    await expect(page.locator('[data-testid="resource-card-challenge"]')).toBeVisible();
    await expect(page.locator('[data-testid="cta-create-course-bottom"]')).toBeVisible();

    // Verify helper columns
    for (const name of ['video', 'community', 'teaching', 'insights', 'support']) {
      await expect(page.locator(`[data-testid="helper-col-${name}"]`)).toBeVisible();
    }

    errorHandlers.assertNoErrors();
  });

  test('should display active list and statistics when instructor has populated courses', async ({ instructorPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    await page.goto('/instructor/dashboard');

    // Assert analytics widgets display stats
    await expect(page.locator('text=Total Courses')).toBeVisible();
    await expect(page.locator('text=Est. Earnings')).toBeVisible();
    
    // Assert course inventory rows are rendered
    const courseRow = page.locator('[data-testid^="course-row-"]').first();
    await expect(courseRow).toBeVisible();

    errorHandlers.assertNoErrors();
  });

  test('should keep Coming Soon tabs disabled and non-navigable', async ({ instructorPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    await page.goto('/instructor/dashboard');

    const bundlesTab = page.locator('[data-testid="tab-course-bundles"]');
    const cloningTab = page.locator('[data-testid="tab-course-cloning"]');

    // Assert they contain cursor-not-allowed
    await expect(bundlesTab).toHaveClass(/cursor-not-allowed/);
    await expect(cloningTab).toHaveClass(/cursor-not-allowed/);

    // Clicking should not change route
    await bundlesTab.click({ force: true });
    await expect(page).toHaveURL('http://localhost:3000/instructor/dashboard');

    await cloningTab.click({ force: true });
    await expect(page).toHaveURL('http://localhost:3000/instructor/dashboard');

    errorHandlers.assertNoErrors();
  });
});
