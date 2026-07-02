import { test as base, Page } from '@playwright/test';

// Define the fixture types
type AuthFixtures = {
  studentPage: Page;
  instructorPage: Page;
};

// Helper: login with retry logic to handle backend rate limiting (429)
async function loginWithRetry(
  page: Page,
  email: string,
  password: string,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', email);
    await page.fill('input[placeholder="Password"]', password);
    await page.click('button:has-text("Continue")');

    try {
      await page.waitForURL(
        url =>
          url.pathname === '/' ||
          url.pathname === '/courses' ||
          url.pathname === '/instructor/dashboard',
        { timeout: 15000 }
      );
      return; // success
    } catch {
      if (attempt < maxRetries) {
        // Back off before retrying — the backend is likely rate-limiting us
        await page.waitForTimeout(2000 * attempt);
      } else {
        throw new Error(
          `Login for ${email} failed after ${maxRetries} attempts (likely 429 rate limit).`
        );
      }
    }
  }
}

// Extend base test to create customized logged-in pages
export const test = base.extend<AuthFixtures>({
  studentPage: async ({ page }, use) => {
    await loginWithRetry(page, 'seed.student@eduflow.com', 'password');
    await use(page);
  },
  instructorPage: async ({ page }, use) => {
    await loginWithRetry(page, 'jonasschmedtmann@eduflow.com', 'password');
    await use(page);
  },
});

export { expect } from '@playwright/test';
