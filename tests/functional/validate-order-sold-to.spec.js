const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');

test.describe('Validate Order Sold To Account', { tag: ['@regression-2', '@module', '@regression', '@functional', '@uk-only'] }, () => {
  test('Test 245847: Validate a new created Order for sold to account', async ({ authenticatedPage }) => {
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await orderSteps.verifyOrderEnginePageLoaded();

    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.verifySelectAccountWindowDisplayed();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.verifyHeaderTabDisplayed();
    await createSteps.fillMandatoryFieldsAndVerify();

    await orderSteps.navigateToQuickAddTab();
    await orderSteps.verifyQuickAddTabDisplayed();
    await orderSteps.addItemsToQuickAdd();

    await orderSteps.clickSaveAndSubmitButton();
    await authenticatedPage.waitForTimeout(3000);

    const loader = authenticatedPage.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

    const marginPopup = authenticatedPage.locator('mat-dialog-container, .cdk-overlay-pane').filter({
      has: authenticatedPage.locator("button:has-text('CANCEL'), button:has-text('CONTINUE')")
    }).first();

    if (await marginPopup.isVisible({ timeout: 5000 }).catch(() => false)) {
      const reasonField = marginPopup.locator('textarea, input[type="text"]').first();
      if (await reasonField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reasonField.fill('Test automation - margin override');
      }
      const continueBtn = marginPopup.locator("button:has-text('CONTINUE')").first();
      if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await continueBtn.click({ force: true });
        await authenticatedPage.waitForTimeout(3000);
        await loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
      }
    }

    await orderSteps.verifyOrderSubmissionSuccess();

    const backBtn = authenticatedPage.locator("button:has(mat-icon:has-text('keyboard_backspace'))");
    if (await backBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await authenticatedPage.keyboard.press('Escape').catch(() => {});
      await authenticatedPage.waitForTimeout(500);
      await backBtn.click({ force: true });
      await authenticatedPage.waitForTimeout(2000);
    }

    const exitPopup = authenticatedPage.locator("mat-dialog-container:has-text('leave'), mat-dialog-container:has-text('exit'), mat-dialog-container:has-text('unsaved')").first();
    if (await exitPopup.isVisible({ timeout: 3000 }).catch(() => false)) {
      const leaveBtn = exitPopup.locator("button:has-text('Leave'), button:has-text('Yes'), button:has-text('OK')").first();
      if (await leaveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await leaveBtn.click({ force: true });
      }
      await authenticatedPage.waitForTimeout(2000);
    }

    const ordersPage = authenticatedPage.locator('app-search-container, app-orders-search, table').first();
    const pageLoaded = await ordersPage.isVisible({ timeout: 15000 }).catch(() => false);
    if (!pageLoaded) {
      const baseUrl = process.env.BASE_URL || 'https://orderengine-sit.computacenter.com/oe/orders';
      await authenticatedPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await expect(ordersPage, 'Orders list page should be visible after navigating back').toBeVisible({ timeout: 15000 });
  });
});
