import { test, expect } from './fixtures/auth';
import { setupErrorHandlers } from './utils/errors';

test.describe('Shopping Cart Flow and Business Logic', () => {
  test('should add course to cart, check duplicate UI state, persist cart on reload, and remove it', async ({ studentPage: page }) => {
    // Clear cart first by going to /cart and removing items
    await page.goto('/cart');
    await page.waitForTimeout(2000); // wait for cart query to load and render
    const removeButtons = page.locator('button:has-text("Remove")');
    while (await removeButtons.count() > 0) {
      await removeButtons.first().click();
      await page.waitForTimeout(1000); // allow deletion to complete and state to refresh
    }

    const errorHandlers = setupErrorHandlers(page);

    // 1. Navigate to courses catalog
    await page.goto('/courses');
    
    // 2. Select a paid course card (index 20 is guaranteed paid and unenrolled since only 5 courses are enrolled total)
    const paidCourseCards = page.locator('div.group\\/card').filter({ hasText: '₹' });
    await expect(paidCourseCards.first()).toBeVisible();
    const targetCourseCard = paidCourseCards.nth(20);
    const courseTitle = await targetCourseCard.locator('h3').first().textContent();
    const courseTitleClean = courseTitle!.trim();
    
    // Click course card to navigate to detail view
    await targetCourseCard.click();
    await expect(page).toHaveURL(/.*\/courses\/.*/);
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForTimeout(1500); // allow client queries to load and render

    // 3. Select Buy option (if not selected) and add to cart
    const buyIndividualRadio = page.locator('div[class*="md:block"]').locator('text=Buy individual course');
    if (await buyIndividualRadio.count() > 0) {
      await buyIndividualRadio.click();
    }

    const addToCartBtn = page.locator('div[class*="md:block"]').locator('button:has-text("Add to Cart")');
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // 4. Verify cart badge count increments in Navbar
    const cartBadge = page.locator('a[href="/cart"] span').filter({ hasText: /^\d+$/ }).filter({ visible: true });
    await expect(cartBadge).toHaveText('1');

    // 5. Verify UI prevents duplicate addition (button changes to "Go to Cart" or similar)
    // In BuySidebarCard.tsx, L148: if enrolled/in cart, shows "Go to course player" or cart redirections
    // Wait, let's verify if button changes to "Go to Cart" or has direct redirection
    const goToCartBtn = page.locator('div[class*="md:block"]').locator('button:has-text("Go to Cart")');
    const addToCartBtnCheck = page.locator('div[class*="md:block"]').locator('button:has-text("Add to Cart")');
    
    // The button in sidebar changes or we can hover to see CourseCard popover.
    // In our detail page, BuySidebarCard handles individual course buy actions.
    // Let's verify we cannot click "Add to Cart" again since it's replaced or disabled
    await expect(addToCartBtnCheck).not.toBeVisible();

    // 6. Navigate to /cart and check items list
    await page.goto('/cart');
    const cartItemTitle = page.locator(`h3:has-text("${courseTitleClean}")`);
    await expect(cartItemTitle).toBeVisible();

    // 7. Cart Persistence: Reload page, verify items still populated
    await page.reload();
    await expect(cartItemTitle).toBeVisible();
    await expect(page.locator('a[href="/cart"] span').filter({ hasText: /^\d+$/ }).filter({ visible: true })).toHaveText('1');

    // 8. Remove item and verify empty cart state
    const removeBtn = page.locator('button:has-text("Remove")').first();
    await removeBtn.click();
    
    // Cart should be empty
    const emptyStateText = page.locator('text=Your cart is empty');
    await expect(emptyStateText).toBeVisible();
    
    errorHandlers.assertNoErrors();
  });
});
