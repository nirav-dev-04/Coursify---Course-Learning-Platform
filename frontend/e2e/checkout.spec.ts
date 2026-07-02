import { test, expect } from './fixtures/auth';
import { setupErrorHandlers } from './utils/errors';
import * as crypto from 'crypto';

test.describe('Checkout and Razorpay Payment Flow', () => {
  
  test.beforeEach(async ({ studentPage: page }) => {
    // Intercept Razorpay SDK load to prevent overwriting of our test mock
    await page.route('https://checkout.razorpay.com/v1/checkout.js', route => {
      route.fulfill({
        contentType: 'application/javascript',
        body: 'console.log("Mock Razorpay SDK loaded");'
      });
    });

    // 1. Clear cart first by going to /cart and removing items
    await page.goto('/cart');
    await page.waitForTimeout(2000); // wait for cart query to load and render
    const removeButtons = page.locator('button:has-text("Remove")');
    while (await removeButtons.count() > 0) {
      await removeButtons.first().click();
      await page.waitForTimeout(1000); // allow deletion to complete and state to refresh
    }

    // 2. Find a course from the catalog that we are not enrolled in
    await page.goto('/courses');
    const courseCards = page.locator('div.group\\/card').filter({ hasText: '₹' });
    await expect(courseCards.first()).toBeVisible();
    const count = await courseCards.count();
    let courseIndex = 20;
    let found = false;
    while (courseIndex < count) {
      const card = courseCards.nth(courseIndex);
      await card.click();
      await expect(page.locator('h1')).toBeVisible();
      await page.waitForTimeout(1000); // allow client queries to load and render actual enrollment buttons
      
      const enrolledBtn = page.locator('button:has-text("Go to course player")').filter({ visible: true });
      if (await enrolledBtn.count() === 0) {
        found = true;
        break;
      }
      
      await page.goto('/courses');
      courseIndex++;
    }
    expect(found).toBe(true);

    // 3. Add to cart
    const addToCartBtn = page.locator('div[class*="md:block"]').locator('button:has-text("Add to Cart")');
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();
    
    const cartBadge = page.locator('a[href="/cart"] span').filter({ hasText: /^\d+$/ }).filter({ visible: true });
    await expect(cartBadge).toHaveText('1');
  });

  test('should test payment success flow with mock Razorpay and backend verification', async ({ studentPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    // Mock Razorpay on the window object
    await page.addInitScript(() => {
      (window as any).Razorpay = function (options: any) {
        this.open = () => {
          // Trigger successful payment callback
          // Note: In E2E we compute correct signature in Node and expose it, or we can mock verify endpoint.
          // Let's pass a special signal payment ID so our test can intercept or compute it.
          const mockPaymentId = 'pay_E2EMockSuccessful123';
          
          // Let's call window.__verifySignature to calculate it in the page context or we do it directly
          const signatureData = options.order_id + '|' + mockPaymentId;
          
          // Compute signature via a helper exposed from Playwright Node environment
          (window as any).__computeSignature(signatureData).then((signature: string) => {
            options.handler({
              razorpay_order_id: options.order_id,
              razorpay_payment_id: mockPaymentId,
              razorpay_signature: signature
            });
          });
        };
      };
    });

    // Expose a binding to compute HMAC-SHA256 signature in Node environment
    await page.exposeFunction('__computeSignature', (data: string) => {
      // Seed secret matching application-dev.yml
      const secret = '6G5v52fM3jA51mcy6MkCXG9D';
      return crypto.createHmac('sha256', secret).update(data).digest('hex');
    });

    // Go to cart
    await page.goto('/cart');
    
    // Proceed to Checkout
    const checkoutBtn = page.locator('button:has-text("Proceed to Checkout")');
    await checkoutBtn.click();
    
    await expect(page).toHaveURL(/.*\/checkout.*/);

    // Fill in State (Required check in checkout)
    const stateDropdown = page.locator('select').nth(1); // second select is state
    await stateDropdown.selectOption('Delhi');

    // Click "Complete Payment"
    // Mock window.alert to prevent blocking test execution
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Payment Successful');
      await dialog.accept();
    });

    const payBtn = page.locator('button:has-text("Complete Payment")');
    await expect(payBtn).toBeVisible();
    await payBtn.click();

    // Verify redirected to learn page after successful payment
    await expect(page).toHaveURL(/.*\/learn\/.*/);

    errorHandlers.assertNoErrors();
  });

  test('should test payment cancellation scenario and verify cart is not cleared', async ({ studentPage: page }) => {
    const errorHandlers = setupErrorHandlers(page);

    // Mock Razorpay cancel flow
    await page.addInitScript(() => {
      (window as any).Razorpay = function (options: any) {
        this.open = () => {
          // Trigger modal dismiss
          if (options.modal && options.modal.ondismiss) {
            options.modal.ondismiss();
          }
        };
      };
    });

    await page.goto('/checkout?type=cart');

    const stateDropdown = page.locator('select').nth(1);
    await stateDropdown.selectOption('Delhi');

    const payBtn = page.locator('button:has-text("Complete Payment")');
    await payBtn.click();

    // Cart badge in navbar should still show "1" (not cleared)
    const cartBadge = page.locator('a[href="/cart"] span').filter({ hasText: /^\d+$/ }).filter({ visible: true });
    await expect(cartBadge).toHaveText('1');

    errorHandlers.assertNoErrors();
  });
});
