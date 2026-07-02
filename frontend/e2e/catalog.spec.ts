import { test, expect } from '@playwright/test';
import { setupErrorHandlers } from './utils/errors';

test.describe('Course Discovery and Search Catalog Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('should verify search autocomplete suggestions as user types', async ({ page }) => {
    const errorHandlers = setupErrorHandlers(page);
    
    // Type query in Navbar search input
    const searchInput = page.locator('input[placeholder="Search for anything..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('java');
    
    // Autocomplete dropdown container should render
    const suggestionsContainer = page.locator('text=Suggested Courses');
    await expect(suggestionsContainer).toBeVisible();
    
    // Verify specific matching suggestion title
    const suggestionItem = page.locator('button:has-text("Java")').first();
    await expect(suggestionItem).toBeVisible();
    
    errorHandlers.assertNoErrors();
  });

  test('should submit search and verify catalog navigation & results', async ({ page }) => {
    const errorHandlers = setupErrorHandlers(page);
    
    const searchInput = page.locator('input[placeholder="Search for anything..."]');
    await searchInput.fill('python');
    
    // Press Enter to submit search
    await searchInput.press('Enter');
    
    // Verify navigation url contains search param
    await expect(page).toHaveURL(/.*\/courses\?q=python.*/);
    
    // Verify header title shows query results
    const resultsHeader = page.locator('h1:has-text("Results for \\"python\\"")');
    await expect(resultsHeader).toBeVisible();
    
    // Verify there are course cards matching the query
    const courseCardsCount = await page.locator('div.group\\/card').count();
    expect(courseCardsCount).toBeGreaterThan(0);
    
    errorHandlers.assertNoErrors();
  });

  test('should filter by course categories correctly', async ({ page }) => {
    const errorHandlers = setupErrorHandlers(page);
    
    // Navigate directly to catalog
    await page.goto('/courses');
    
    // Click category filter checkbox (for example "Software Engineering")
    await page.goto('/courses?category=Software+Engineering');
    
    // Verify heading matches category
    const categoryHeader = page.locator('h1:has-text("Software Engineering")');
    await expect(categoryHeader).toBeVisible();
    
    errorHandlers.assertNoErrors();
  });

  test('should display empty search results state properly', async ({ page }) => {
    const errorHandlers = setupErrorHandlers(page);
    
    // Search for a non-existent course query
    await page.goto('/courses?q=nonexistentqueryxyz');
    
    // Verify proper empty state text matches
    const emptyStateText = page.locator('text=No course listings match your active filters.');
    await expect(emptyStateText).toBeVisible();
    
    const resetBtn = page.locator('button:has-text("Reset Filter Choices")');
    await expect(resetBtn).toBeVisible();
    
    errorHandlers.assertNoErrors();
  });

  test('should click course card and navigate to details view', async ({ page }) => {
    const errorHandlers = setupErrorHandlers(page);
    
    await page.goto('/courses');
    
    // Get the first course card title and link
    const firstCardLink = page.locator('div.group\\/card a').first();
    const firstCardTitle = await page.locator('div.group\\/card h3').first().textContent();
    
    // Click on the first card
    await firstCardLink.click();
    
    // Expect details page url slug
    await expect(page).toHaveURL(/.*\/courses\/.*/);
    
    // Expect course detail page heading matches first card title
    const detailsHeading = page.locator('h1');
    await expect(detailsHeading).toHaveText(firstCardTitle!.trim());
    
    errorHandlers.assertNoErrors();
  });
});
