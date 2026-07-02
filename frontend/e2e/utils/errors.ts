import { Page } from '@playwright/test';

export function setupErrorHandlers(page: Page) {
  const errors: string[] = [];

  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore normal expected logs/warnings/failures to prevent false positives
      if (
        !text.includes('Failed to load resource') &&
        !text.includes('401') && // Expected auth flow checks
        !text.includes('404') && // Expected 404 testing
        !text.includes('api/auth/refresh') &&
        !text.includes('[GSI_LOGGER]') && // Third-party Google Identity SDK warnings
        !text.includes('FedCM') && // Federated Credential Management warnings
        !text.includes('Google Sign-In') &&
        !text.includes('Provider') && // Google FedCM "Provider's accounts list is empty"
        !text.includes('aborted') && // Normal fetch/xhr request cancellations
        !text.includes('AbortError')
      ) {
        const errStr = `[Captured Console Error] ${text}`;
        console.error(errStr);
        errors.push(errStr);
      }
    }
  });

  // Capture page error exceptions
  page.on('pageerror', (exception) => {
    const errStr = `[Captured Page Exception] ${exception.stack || exception.message}`;
    console.error(errStr);
    errors.push(errStr);
  });

  // Capture server side 5xx responses
  page.on('response', (response) => {
    if (response.status() >= 500) {
      const errStr = `[Captured Server 5xx Response] ${response.url()} returned status ${response.status()}`;
      console.error(errStr);
      errors.push(errStr);
    }
  });

  return {
    assertNoErrors: () => {
      if (errors.length > 0) {
        throw new Error(`Test failed due to unexpected console/page/network errors:\n${errors.join('\n')}`);
      }
    }
  };
}
