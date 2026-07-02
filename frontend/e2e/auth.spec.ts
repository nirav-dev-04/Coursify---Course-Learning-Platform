import { test, expect } from '@playwright/test';
import { setupErrorHandlers } from './utils/errors';

test.describe('Authentication and Session Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to base url
    await page.goto('/');
  });

  test('should register a new student successfully and redirect to login', async ({ page }) => {
    const errorHandlers = setupErrorHandlers(page);
    
    await page.goto('/register');
    
    const uniqueEmail = `student_${Date.now()}@eduflow.com`;
    
    await page.fill('input[placeholder="Full Name"]', 'Test Student E2E');
    await page.fill('input[placeholder="Email"]', uniqueEmail);
    await page.fill('input[placeholder="Password"]', 'password123');
    
    // Continue
    await page.click('button:has-text("Continue")');
    
    // Expect success message
    const successMsg = page.locator('text=Registration successful! Redirecting to login page...');
    await expect(successMsg).toBeVisible();
    
    // Expect redirect to login page within timeout
    await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
    
    errorHandlers.assertNoErrors();
  });

  test('should login with seeded student, verify session persistence, and logout', async ({ page }) => {
    const errorHandlers = setupErrorHandlers(page);
    
    // 1. Login with seeded student
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'seed.student@eduflow.com');
    await page.fill('input[placeholder="Password"]', 'password');
    await page.click('button:has-text("Continue")');
    
    // Expect redirect to home or courses page
    await expect(page).toHaveURL(/http:\/\/localhost:3000\/?(courses)?/);
    
    // 2. Verify Navbar updates to show profile avatar or settings link
    // Checking presence of profile dropdown or settings link (e.g. href containing settings or profile avatar button)
    const profileLink = page.locator('a[href="/user/settings"]').first();
    await expect(profileLink).toBeVisible();
    
    // 3. Verify session persists on page reload
    await page.reload();
    await expect(profileLink).toBeVisible();
    
    // 4. Logout
    // Open profile menu (the profileLink is the avatar button)
    await profileLink.click();
    const logoutBtn = page.locator('button:has-text("Log out")');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    
    // Expect session cleared, login button is back in Navbar
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
    
    // 5. Verify protected routes redirect to /login
    await page.goto('/my-courses');
    await expect(page).toHaveURL(/.*\/login\?redirect=.*/);
    
    errorHandlers.assertNoErrors();
  });

  test('should display proper error message for invalid credentials', async ({ page }) => {
    const errorHandlers = setupErrorHandlers(page);
    
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'wrong.email@eduflow.com');
    await page.fill('input[placeholder="Password"]', 'wrongpassword');
    await page.click('button:has-text("Continue")');
    
    // Expect error message container is visible
    const errorBox = page.locator('.bg-red-50');
    await expect(errorBox).toBeVisible();
    
    errorHandlers.assertNoErrors();
  });

  test('should redirect to login when JWT cookie is missing or invalid', async ({ page }) => {
    const errorHandlers = setupErrorHandlers(page);
    
    // Clear cookies
    await page.context().clearCookies();
    
    // Navigate to protected page
    await page.goto('/my-courses');
    await expect(page).toHaveURL(/.*\/login\?redirect=.*/);
    
    errorHandlers.assertNoErrors();
  });
});
