import { test, expect } from './fixtures/auth';
import { setupErrorHandlers } from './utils/errors';

test.describe('Course Creation Wizard Happy Path', () => {

  test('should successfully complete 4-step wizard and verify course draft exists in database', async ({ instructorPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    await page.goto('/instructor/courses/create');

    // Step 1: Course Type
    const courseCard = page.locator('[data-testid="card-course-type-video"]');
    await courseCard.click();

    const nextBtn = page.locator('[data-testid="wizard-next"]');
    await nextBtn.click();

    // Step 2: Title
    const titleInput = page.locator('[data-testid="wizard-input-title"]');
    const courseTitle = `E2E Wizard Course_${Date.now()}`;
    await titleInput.fill(courseTitle);
    await nextBtn.click();

    // Step 3: Category
    const categorySelect = page.locator('[data-testid="wizard-select-category"]');
    await categorySelect.selectOption('Software Engineering');
    await nextBtn.click();

    // Step 4: Description & Price
    const descTextarea = page.locator('[data-testid="wizard-input-description"]');
    const priceInput = page.locator('[data-testid="wizard-input-price"]');
    const submitBtn = page.locator('[data-testid="wizard-submit"]');

    await descTextarea.fill('Successfully registered custom course via step-by-step E2E flow.');
    await priceInput.fill('499');

    // Brief delay to avoid backend rate-limiting (429) from previous rapid test logins
    await page.waitForTimeout(1000);

    // Intercept backend creation request
    const creationPromise = page.waitForResponse(response => 
      response.url().includes('/api/courses') && 
      response.request().method() === 'POST'
    );

    await submitBtn.click();

    // Verify response is a success (200/201)
    const response = await creationPromise;
    const status = response.status();
    expect(status, `Expected 200 or 201 but got ${status}`).toBeLessThan(300);

    // Verify redirection to editing panel
    await expect(page).toHaveURL(/.*\/instructor\/courses\/(\d+)\/edit/);

    const url = page.url();
    const match = url.match(/\/instructor\/courses\/(\d+)\/edit/);
    const courseId = match ? match[1] : null;
    expect(courseId).not.toBeNull();

    // Verify course draft exists in the database via Playwright request API (shares browser cookies)
    const apiResponse = await page.request.get(`http://localhost:5001/api/courses/${courseId}`);
    expect(apiResponse.ok(), `GET /api/courses/${courseId} returned ${apiResponse.status()}`).toBeTruthy();

    const dbVerification = await apiResponse.json();
    expect(dbVerification).not.toBeNull();
    expect(dbVerification.id.toString()).toBe(courseId);
    expect(dbVerification.title).toBe(courseTitle);
    expect(dbVerification.status).toBe('DRAFT');

    errorHandlers.assertNoErrors();
  });
});
