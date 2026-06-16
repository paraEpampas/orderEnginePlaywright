const { test } = require('../../fixtures/base.fixture');
const { FindAddressSteps } = require('../../steps/orders/find-address.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');

test.describe('Find Address', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test.beforeEach(async ({ authenticatedPage, country }) => {
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    await orderSteps.verifyOrderEnginePageLoaded();
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.searchForAccountAndSelectFirst();
    await authenticatedPage.waitForTimeout(2000);
    if (country && country.toUpperCase() === 'FR') {
      await orderSteps.checkAndSelectShipTo();
      await authenticatedPage.waitForTimeout(2000);
    }
  });

  test('verify find address button NOT present for non-FR countries', async ({ authenticatedPage, country }) => {
    const steps = new FindAddressSteps(authenticatedPage);
    if (country && country.toUpperCase() === 'FR') {
      test.skip(true, 'Find address button is expected for FR - skipping non-FR assertion');
    } else {
      await steps.verifyFindAddressButtonNotPresent();
    }
  });

  test('verify find address button visibility based on country config', async ({ authenticatedPage, country }) => {
    const steps = new FindAddressSteps(authenticatedPage);
    await steps.verifyFindAddressButtonVisibilityForCountry(country);
  });
});
