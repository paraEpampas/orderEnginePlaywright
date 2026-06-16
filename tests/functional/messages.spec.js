const { test } = require('../../fixtures/base.fixture');
const { MessagesSteps } = require('../../steps/orders/messages.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');

test.describe('Messages', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    const createSteps = new CreateOrderSteps(authenticatedPage);
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.fillMandatoryFieldsAndVerify();
    await createSteps.submitOrder();
    await authenticatedPage.waitForTimeout(3000);
  });

  test('verify messages tab content displays', async ({ authenticatedPage }) => {
    const steps = new MessagesSteps(authenticatedPage);
    const editIcon = steps.orderDetails.editIcon;
    const isVisible = await editIcon.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await steps.clickEditIcon();
      await authenticatedPage.waitForTimeout(1000);
    }
    await steps.verifyMessagesTabContent();
  });
});
