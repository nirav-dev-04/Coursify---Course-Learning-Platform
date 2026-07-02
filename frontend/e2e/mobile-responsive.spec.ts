import { test, expect } from './fixtures/auth';
import { setupErrorHandlers } from './utils/errors';

test.describe('Instructor Dashboard Mobile & Tablet Responsiveness', () => {

  test.beforeEach(async ({ page }) => {
    // Force zero courses so the empty dashboard resources render
    await page.route('**/api/courses/instructor/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
  });

  test('should verify vertical card stacking and horizontal tab scrolling on mobile (375px)', async ({ instructorPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    // Set viewport to mobile width
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/instructor/dashboard');

    // 1. Assert resource cards (Video vs Audience) stack vertically
    const cardVideo = page.locator('[data-testid="resource-card-video"]');
    const cardAudience = page.locator('[data-testid="resource-card-audience"]');
    
    await expect(cardVideo).toBeVisible();
    await expect(cardAudience).toBeVisible();

    const boxVideo = await cardVideo.boundingBox();
    const boxAudience = await cardAudience.boundingBox();

    expect(boxVideo).not.toBeNull();
    expect(boxAudience).not.toBeNull();

    // In stacked layout, Card Audience must start below Card Video
    expect(boxAudience!.y).toBeGreaterThanOrEqual(boxVideo!.y + boxVideo!.height);

    // 2. Assert helper columns stack vertically (column 2 below column 1)
    const colVideo = page.locator('[data-testid="helper-col-video"]');
    const colCommunity = page.locator('[data-testid="helper-col-community"]');

    const boxColVideo = await colVideo.boundingBox();
    const boxColCommunity = await colCommunity.boundingBox();

    expect(boxColVideo).not.toBeNull();
    expect(boxColCommunity).not.toBeNull();

    expect(boxColCommunity!.y).toBeGreaterThanOrEqual(boxColVideo!.y + boxColVideo!.height);

    // 3. Assert nav tabs scroll horizontally rather than wrapping
    const tabsContainer = page.locator('.overflow-x-auto').first();
    const isScrollable = await tabsContainer.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });

    expect(isScrollable).toBe(true);

    errorHandlers.assertNoErrors();
  });

  test('should verify side-by-side card layout on tablet viewport (768px)', async ({ instructorPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    // Set viewport to tablet width
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/instructor/dashboard');

    // On 768px, Tailwind's md:grid-cols-2 takes effect. Let's verify side-by-side layout
    const cardVideo = page.locator('[data-testid="resource-card-video"]');
    const cardAudience = page.locator('[data-testid="resource-card-audience"]');

    await expect(cardVideo).toBeVisible();
    await expect(cardAudience).toBeVisible();

    const boxVideo = await cardVideo.boundingBox();
    const boxAudience = await cardAudience.boundingBox();

    expect(boxVideo).not.toBeNull();
    expect(boxAudience).not.toBeNull();

    // Side-by-side means their y-positions are aligned, and x of Audience is to the right
    const yDifference = Math.abs(boxVideo!.y - boxAudience!.y);
    expect(yDifference).toBeLessThan(10); // aligned y position

    expect(boxAudience!.x).toBeGreaterThanOrEqual(boxVideo!.x + boxVideo!.width);

    errorHandlers.assertNoErrors();
  });
});
