const { test } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { OELandingPageSteps } = require('../../steps/oe-landing-page.steps');

test.describe('Order Engine Login Orders', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test('Test 245665: Order Engine / Login / Orders', async ({ authenticatedPage }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const landingSteps = new OELandingPageSteps(authenticatedPage);

    await orderSteps.verifyOrderEnginePageLoaded();

    await landingSteps.verifyAllSearchFieldsDisplayed();
    await landingSteps.verifyCCCompanyOptions();
    await landingSteps.verifyOrderStatusOptions();
    await landingSteps.verifyLastModifiedOptions();
    await landingSteps.verifyOrderTypeOptions();
    await landingSteps.verifySelectOriginOptions();

    await landingSteps.verifyClearFieldsAndSearchButtons();

    await landingSteps.verifyAllTableColumnsDisplayed();

    await landingSteps.verifyUserAndHelpButtons();
  });
});
