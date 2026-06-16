const { test } = require('../../fixtures/base.fixture');
const { BrowserNavigationSteps } = require('../../steps/browser-navigation.steps');

test.describe('Browser Navigation', { tag: ['@smoke', '@navigation', '@module', '@regression'] }, () => {
  test('verify browser opens and navigates to OE page', async ({ authenticatedPage }) => {
    const steps = new BrowserNavigationSteps(authenticatedPage);
    await steps.verifyBrowserOpens();
    await steps.verifyPageLoads();
  });

  test('verify browser configuration from properties', async ({ authenticatedPage }) => {
    const steps = new BrowserNavigationSteps(authenticatedPage);
    await steps.verifyBrowserOpens();
    await steps.verifyPageLoads();
  });
});
