const { test } = require('../../fixtures/base.fixture');
const { OrderEditSteps } = require('../../steps/orders/order-edit.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { randomCustomerOrderRef } = require('../../data/generators');

test.describe('Order Edit', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test('Test 245730: Edit an Order', async ({ authenticatedPage }) => {
    const orderRef = randomCustomerOrderRef();
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.fillMandatoryFieldsWithRef(orderRef);
    await orderSteps.checkAndSelectShipTo();
    await createSteps.submitOrder();
    await authenticatedPage.waitForTimeout(3000);

    const editSteps = new OrderEditSteps(authenticatedPage);
    editSteps.setOrderReference(orderRef);

    const isStillInEditMode = await authenticatedPage.locator("oe-input[formcontrolname='orderCustomerReference'] input, input[formcontrolname='orderCustomerReference']").first().isEditable().catch(() => false);

    if (isStillInEditMode) {
      await editSteps.makeChangesAndSave();
      await editSteps.deleteMandatoryFieldAndAttemptSave();
      await editSteps.verifyValidationError();
    } else {
      await createSteps.goBackToOrdersList();
      await createSteps.searchForOrderByRef(orderRef);
      await editSteps.chooseOrderAndClickEditIcon();
      await editSteps.makeChangesAndSave();
      await editSteps.deleteMandatoryFieldAndAttemptSave();
      await editSteps.verifyValidationError();
    }
  });
});
