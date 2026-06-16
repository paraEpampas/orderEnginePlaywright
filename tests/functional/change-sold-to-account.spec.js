const { test, expect } = require('../../fixtures/base.fixture');
const { ChangeSoldToSteps } = require('../../steps/orders/change-sold-to.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { getCountryConfig } = require('../../data/constants/country-config');

const SELECTORS = {
  editButton: "button:has(mat-icon:has-text('edit'))",
  syncButton: "button:has(mat-icon:text-is('sync_alt'))",
  savedStatus: "h2:has-text('Saved'), h2.order:has-text('Saved'), h2:has-text('Submitted')",
};

async function createAndSaveOrderForChangeSoldTo(page, orderSteps, createSteps, country) {
  const countryConfig = getCountryConfig(country);

  await orderSteps.verifyOrderEnginePageLoaded();
  await createSteps.clickCreateOrderForSoldToAccountButton();
  await createSteps.searchForAccountAndSelectFirst();
  await createSteps.fillMandatoryHeaderFields();
  await orderSteps.checkAndSelectShipTo();
  if (countryConfig.code === 'FR' || countryConfig.code === 'DE') {
    await orderSteps.checkAndSelectBillTo();
    await orderSteps.checkAndSelectPayer();
  }
  await orderSteps.fillMissingHeaderFields();

  await orderSteps.navigateToQuickAddTab();
  await orderSteps.addItemsToQuickAdd();
  await expect(page.locator("tbody tr[formarrayname='basicPrice'], tbody tr").first()).toBeVisible({ timeout: 20000 });
  await orderSteps.setUnitSellPriceForAllItems('100');
  await orderSteps.clickRecalcButton();

  await orderSteps.saveOrder();
  await orderSteps.verifyOrderStatusAfterSubmission();
  await expect(
    page.locator(SELECTORS.savedStatus).or(page.locator(SELECTORS.editButton)).first()
  ).toBeVisible({ timeout: 30000 });

  const syncButton = page.locator(SELECTORS.syncButton);
  if (!(await syncButton.isVisible({ timeout: 5000 }).catch(() => false))) {
    page.once('dialog', (dialog) => dialog.accept().catch(() => {}));
    await orderSteps.clickEditIcon();
  }
  await expect(syncButton).toBeVisible({ timeout: 15000 });
}

test.describe('Change Sold-To Account', { tag: ['@regression-2', '@module', '@health-check', '@regression', '@functional'] }, () => {
  test.describe.configure({ timeout: 300_000 });

  test.beforeEach(async ({ authenticatedPage, country }) => {
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    await createAndSaveOrderForChangeSoldTo(authenticatedPage, orderSteps, createSteps, country);
  });

  test('Change sold-to immediately after save', async ({ authenticatedPage }) => {
    const steps = new ChangeSoldToSteps(authenticatedPage);
    const countryConfig = getCountryConfig();
    await steps.clickChangeSoldToButton();
    await steps.verifySelectAccountModalDisplayed();
    await steps.searchForNewAccount(countryConfig.accounts);
    await steps.selectAlternateAccount();
    await steps.handlePreservePricingDialog(true);
    await steps.verifyAccountChanged();
  });

  test('Change sold-to without preserving pricing', async ({ authenticatedPage }) => {
    const steps = new ChangeSoldToSteps(authenticatedPage);
    const countryConfig = getCountryConfig();
    await steps.clickChangeSoldToButton();
    await steps.verifySelectAccountModalDisplayed();
    await steps.searchForNewAccount(countryConfig.accounts);
    await steps.selectAlternateAccount();
    await steps.handlePreservePricingDialog(false);
    await steps.verifyAccountChanged();
  });
});
