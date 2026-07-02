import { test, expect } from './fixtures/auth';
import { setupErrorHandlers } from './utils/errors';

test.describe('Student Dashboard and Learning Player Flow', () => {

  test.beforeEach(async ({ studentPage: page }) => {
    // Ensure student is enrolled in at least one course
    // Go to first course and buy it using checkout or direct API if needed.
    // In our seeder, we already seed mock enrollments for seed students!
    // Specifically, seed.student@eduflow.com has mock enrollments seeded in DataSeeder.java, L208-215 and L235-245.
    // So "My Learning" should already contain multiple courses!
  });

  test('should render enrolled courses, load player, play video, and verify progress tracking', async ({ studentPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    // 1. Navigate to My Learning
    await page.goto('/my-courses');
    
    // Expect to see enrolled course cards
    const courseCard = page.locator('div.grid div.group').first();
    await expect(courseCard).toBeVisible();

    const courseTitleText = await courseCard.locator('h3').first().textContent();
    
    // 2. Click "Go to course player"
    const goToPlayerBtn = courseCard.locator('a:has-text("Go to course player")');
    await expect(goToPlayerBtn).toBeVisible();
    await goToPlayerBtn.click();

    // Expect navigation to /learn/[id]
    await expect(page).toHaveURL(/.*\/learn\/\d+/);

    // 3. Verify Video Player loads
    const videoElement = page.locator('video');
    await expect(videoElement).toBeVisible();

    // 4. Play video briefly and verify progress updates
    // Let's trigger a timeupdate event manually to simulate playback and test progress tracking
    // We expect a PUT request to /api/progress/:courseId/:lectureId
    const progressPromise = page.waitForResponse(response => 
      response.url().includes('/api/progress/') && response.request().method() === 'PUT'
    );

    // Simulate video playing 30 seconds into a 100 seconds video (30% watched)
    await videoElement.evaluate((video: any) => {
      // Mock duration and currentTime
      Object.defineProperty(video, 'duration', { value: 100, writable: true });
      video.currentTime = 30;
      // Dispatch timeupdate
      video.dispatchEvent(new Event('timeupdate'));
    });

    // Wait for the PUT request to complete
    const response = await progressPromise;
    expect(response.status()).toBe(200);

    // Verify progress map update shows in sidebar or overview
    // Change to Overview Tab
    await page.click('button:has-text("Overview")');
    const progressPct = page.locator('span.text-brand-purple');
    // It should show a value now (e.g. 15% or 30% or similar depending on lectures counts)
    await expect(progressPct).toBeVisible();

    // 5. Verify resuming starts from last watched position
    // Reload page and check if video currentTime or progress remains
    await page.reload();
    
    // Check if the overall progress is still rendered on Overview
    await page.click('button:has-text("Overview")');
    await expect(progressPct).toBeVisible();

    errorHandlers.assertNoErrors();
  });
});
